import Link from "next/link";
import { ArrowRight, Globe, MessageCircle, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  {
    icon: Store,
    title: "Your own storefront",
    body: "Your business gets its own address on the web, ready to share with customers.",
    status: "Available now",
  },
  {
    icon: Globe,
    title: "Language, currency and country — independent",
    body: "Sell in USD from Mozambique, or in EUR with an English storefront. Nothing is locked to a country.",
    status: "Available now",
  },
  {
    icon: MessageCircle,
    title: "Structured orders on WhatsApp",
    body: "Customers check out and you receive the order as a structured WhatsApp message.",
    status: "Coming next",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Sell online.
            <br />
            Take orders on WhatsApp.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Elicani gives small businesses a real online store — products,
            customers and orders in one place, in any currency you choose.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Create your store
                <ArrowRight aria-hidden="true" data-icon="inline-end" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="bg-card">
              <CardHeader className="space-y-3">
                <span className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-muted text-foreground">
                  <feature.icon aria-hidden="true" className="size-4.5" />
                </span>
                <CardTitle className="text-base leading-snug tracking-tight">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.body}
                </CardDescription>
                <Badge
                  variant="outline"
                  className="w-fit font-normal text-muted-foreground"
                >
                  {feature.status}
                </Badge>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
