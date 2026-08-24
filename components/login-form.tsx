"use client";

import { useSignIn } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import googleIcon from "@/assets/icons/google.png";
import { LoginPayload } from "@/types/LoginPayload";
import { useClerk } from "@clerk/nextjs";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { setActive } = useClerk();

  const { control, handleSubmit } = useForm<LoginPayload>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginPayload) {
    try {
      await signIn.password({
        emailAddress: data.email,
        password: data.password,
      });

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: async ({ session, decorateUrl }) => {
            // Check if the choose-organization task is pending
            if (session?.currentTask?.key === "choose-organization") {
              // Retrieve the user's first available organization membership
              const userOrgId =
                session.user?.organizationMemberships?.[0]?.organization?.id ||
                process.env.CLERK_ORGANIZATION_ID;

              // Activate the organization to clear the pending session task
              await setActive({
                session: session.id,
                organization: userOrgId,
              });
            }

            const url = decorateUrl("/dashboard");
            router.push(url);
          },
        });
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>

        <Controller
          control={control}
          name="email"
          rules={{ required: "Email is required" }}
          render={({ field: { value, onChange } }) => (
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={value}
                onChange={onChange}
                placeholder="m@example.com"
                required
                className="rounded-md"
              />
            </Field>
          )}
        />

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Controller
            control={control}
            name="password"
            rules={{ required: "Password is required" }}
            render={({ field: { value, onChange } }) => (
              <Input
                value={value}
                onChange={onChange}
                id="password"
                type="password"
                required
                className="rounded-md"
              />
            )}
          />
        </Field>

        <Field>
          <Button type="submit" className="rounded-md">
            Login
          </Button>
        </Field>

        <FieldSeparator className="bg-surface!">
          Or continue with
        </FieldSeparator>

        <Field>
          <Button variant="outline" type="button" className="rounded-md">
            <Image
              alt="Google icon"
              priority
              src={googleIcon}
              className="size-4"
            />
            Login with Google
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
