import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '/workspaces/re-Lamatic-Docs/styles/Home.module.css'
import { SearchDialog } from '/workspaces/re-Lamatic-Docs/components/SearchDialog'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'



export default function Home() {
  return (
    <>
      <Head>
        <title>Lamatic.ai Assistant</title>
        <meta
          name="description"
          content="Lamatic.ai Assistant is a search engine for your Lamatic.ai account. Get help with any question you have in mind about the product."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/chatlogo.png" />
      </Head>
      <main className={styles.main}>
        <div className={styles.center}>
          <SearchDialog />
        </div>

        <div className="py-8 w-full flex items-center justify-center space-x-6">
          <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
            <Link href="https://lamatic.ai/" className="flex items-center justify-center">
              <p className="text-base mr-2">Powered by Lamatic.ai</p>
              <Image src={'/chatlogo.png'} width="20" height="20" alt="Supabase logo" />
            </Link>
          </div>
          <div className="border-l border-gray-300 w-1 h-4" />
          <div className="flex items-center justify-center space-x-4">
            <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
              <Link
                href="https://github.com/supabase/supabase"
                className="flex items-center justify-center"
              >
                <Image src={'/github.svg'} width="20" height="20" alt="Github logo" />
              </Link>
            </div>
            <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
              <Link
                href="https://twitter.com/supabase"
                className="flex items-center justify-center"
              >
                <Image src={'/twitter.svg'} width="20" height="20" alt="Twitter logo" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
