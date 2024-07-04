
import { serve } from "std/http/server.ts";
import 'https://deno.land/x/xhr@0.2.1/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0'
import { codeBlock, oneLine } from 'https://esm.sh/common-tags@1.8.2'
import GPT3Tokenizer from 'https://esm.sh/gpt3-tokenizer@1.1.5'
import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
  Configuration,
  CreateChatCompletionRequest,
  OpenAIApi,
} from 'https://esm.sh/openai@3.2.1'
const PORT = Deno.env.get('PORT') || 3333; // Default to 3333 if the environment variable is not set
const openAiKey = Deno.env.get('OPENAI_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

export class ApplicationError extends Error {
  constructor(message: string, public data: Record<string, any> = {}) {
    super(message);
  }
}

export class UserError extends ApplicationError {}
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    if (!openAiKey) {
      throw new ApplicationError('Missing environment variable OPENAI_KEY')
    }

    if (!supabaseUrl) {
      throw new ApplicationError('Missing environment variable SUPABASE_URL')
    }

    if (!supabaseServiceKey) {
      throw new ApplicationError('Missing environment variable SUPABASE_SERVICE_ROLE_KEY')
    }

    const requestData = await req.json()

    if (!requestData) {
      throw new UserError('Missing request data')
    }

    const { query } = requestData

    if (!query) {
      throw new UserError('Missing query in request data')
    }

    // Intentionally log the query
    console.log({ query })

    const sanitizedQuery = query.trim()

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const configuration = new Configuration({ apiKey: openAiKey })
    const openai = new OpenAIApi(configuration)

    // Moderate the content to comply with OpenAI T&C
    const moderationResponse = await openai.createModeration({ input: sanitizedQuery })

    const [results] = moderationResponse.data.results

    if (results.flagged) {
      throw new UserError('Flagged content', {
        flagged: true,
        categories: results.categories,
      })
    }

    const embeddingResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: sanitizedQuery.replaceAll('\n', ' '),
    })

    if (embeddingResponse.status !== 200) {
      throw new ApplicationError('Failed to create embedding for question', embeddingResponse)
    }

    const [{ embedding }] = embeddingResponse.data.data

    const { error: matchError, data: pageSections } = await supabaseClient.rpc(
      'match_page_sections',
      {
        embedding,
        match_threshold: 0.78,
        match_count: 10,
        min_content_length: 50,
      }
    )

    if (matchError) {
      throw new ApplicationError('Failed to match page sections', matchError)
    }

    const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })
    let tokenCount = 0
    let contextText = ''

    for (let i = 0; i < pageSections.length; i++) {
      const pageSection = pageSections[i]
      const content = pageSection.content
      const encoded = tokenizer.encode(content)
      tokenCount += encoded.text.length

      if (tokenCount >= 1500) {
        break
      }

      contextText += `${content.trim()}\n---\n`
    }

    const prompt = codeBlock`
      ${oneLine`
      You are a very enthusiastic Lamatic.ai representative who loves
      to help people! Given the following sections from the Supabase
      documentation, answer the question using only that information,
      outputted in markdown format. If you are unsure and the answer
      is not explicitly written in the documentation, say
      "Sorry, I don't know how to help with that."
      `}

      Context sections:
      ${contextText}

      Question: """
      ${sanitizedQuery}
      """

      Answer as markdown (including related code snippets if available):
    `

    const messages: ChatCompletionRequestMessage[] = [
      {
        role: ChatCompletionRequestMessageRoleEnum.System,
        content: codeBlock`
          ${oneLine`
            You are a very enthusiastic Lamatic.AI who loves
            to help people! Given the following information from
            the Lamatic.ai documentation, answer the user's question using
            only that information, outputted in markdown format.
          `}

          ${oneLine`
            If you are unsure
            and the answer is not explicitly written in the documentation, say
            "Sorry, I don't know how to help with that."
          `}
          
          ${oneLine`
            Always include related code snippets if available.
          `}
        `,
      },
      {
        role: ChatCompletionRequestMessageRoleEnum.User,
        content: codeBlock`
          Here is the Lamatic.ai documentation:
          ${contextText}
        `,
      },
      {
        role: ChatCompletionRequestMessageRoleEnum.User,
        content: codeBlock`
          ${oneLine`
            Answer my next question using only the above documentation.
            You must also follow the below rules when answering:
          `}
          ${oneLine`
            - Do not make up answers that are not provided in the documentation.
          `}
          ${oneLine`
            - If you are unsure and the answer is not explicitly written
            in the documentation context, say
            "Sorry, I don't know how to help with that."
          `}
          ${oneLine`
            - Prefer splitting your response into multiple paragraphs.
          `}
          ${oneLine`
            - Output as markdown with code snippets if available.
          `}
        `,
      },
      {
        role: ChatCompletionRequestMessageRoleEnum.User,
        content: codeBlock`
          Here is my question:
          ${oneLine`${sanitizedQuery}`}
      `,
      },
    ]

    const completionOptions: CreateChatCompletionRequest = {
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 1024,
      temperature: 0,
      stream: true,
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(completionOptions),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApplicationError('Failed to generate completion', error)
    }

    // Proxy the streamed SSE response from OpenAI
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    })
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: err.message,
          data: err.data,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else if (err instanceof ApplicationError) {
      // Print out application errors with their additional data
      console.error(`${err.message}: ${JSON.stringify(err.data)}`)
    } else {
      // Print out unexpected errors as is to help with debugging
      console.error(err)
    }

    // TODO: include more response info in debug environments
    return new Response(
      JSON.stringify({
        error: 'There was an error processing your request',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})