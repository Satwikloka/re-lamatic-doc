import Link from "next/link";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const continentHostMapping = {
  AF: "https://lamatic.ai", // Africa
  AN: "https://lamatic.ai", // Antarctica
  AS: "https://lamatic.ai", // Asia
  EU: "https://cloud.lamaticai.com", // Europe
  NA: "https://us.cloud.lamaticai.com", // North America
  OC: "https://cloud.lamaticai.com", // Oceania
  SA: "https://us.cloud.lamaticai.com", // South America
};

export const ToAppButton = () => {
  const [signedInUS, setSignedInUS] = useState(false);
  const [signedInEU, setSignedInEU] = useState(false);
  const [continentCode, setContinentCode] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      fetch("https://us.cloud.lamaticai.com/api/auth/session", {
        credentials: "include",
        mode: "cors",
      })
        .then((us) => us.json())
        .then((usData) => {
          setSignedInUS(isSignedIn(usData));
        })
        .catch(() => {
          setSignedInUS(false);
        });

      fetch("https://cloud.lamaticai.com/api/auth/session", {
        credentials: "include",
        mode: "cors",
      })
        .then((eu) => eu.json())
        .then((euData) => {
          setSignedInEU(isSignedIn(euData));
        })
        .catch(() => {
          setSignedInEU(false);
        });

      fetch("/api/get-continent-code")
        .then((response) => response.json())
        .then((data) => {
          if (data.continentCode && continentHostMapping[data.continentCode]) {
            setContinentCode(data.continentCode);
          }
        })
        .catch(() => {
          setContinentCode(null);
        });
    }
  }, []);

  if (signedInUS && signedInEU) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="xs" className="whitespace-nowrap w-[70px]">
            To App
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild key="us">
            <Link href="https://us.cloud.lamaticai.com">US region</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild key="eu">
            <Link href="https://cloud.lamaticai.com">EU region</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  } else if (signedInUS || signedInEU) {
    return (
      <Button size="xs" asChild className="whitespace-nowrap w-[70px]">
        <Link
          href={
            signedInUS
              ? "https://us.cloud.lamaticai.com"
              : "https://cloud.lamaticai.com"
          }
        >
          To App
        </Link>
      </Button>
    );
  } else {
    return (
      <Button size="xs" asChild className="whitespace-nowrap w-[70px]">
        <Link
          href={
            continentCode
              ? continentHostMapping[continentCode]
              : "https://lamatic.ai"
          }
        >
          Sign Up
        </Link>
      </Button>
    );
  }
};

const isSignedIn = (session: Record<string, unknown>) => {
  // check if session is object and has key "user", get typing right
  return session && "user" in session;
};
