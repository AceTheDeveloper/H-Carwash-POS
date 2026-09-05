"use client";

import { useSignIn, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import { LoaderCircle, AlertCircle } from "lucide-react";

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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { setActive } = useClerk();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Destructured setError and errors from formState
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginPayload>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginPayload) {
    setIsLoading(true);

    try {
      await signIn.password({
        emailAddress: data.email,
        password: data.password,
      });

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask?.key === "choose-organization") {
              const userOrgId =
                session.user?.organizationMemberships?.[0]?.organization?.id ||
                process.env.CLERK_ORGANIZATION_ID;

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
      // Extract Clerk's readable error message, or provide a fallback
      const errorMessage =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        "Invalid credentials. Please try again.";

      // Set a root error for the form
      setError("root", { type: "manual", message: errorMessage });
    } finally {
      setIsLoading(false);
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

        {/* Display Global/Clerk Errors here */}
        {errors.root && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-500/10 rounded-md border border-red-500/20">
            <AlertCircle className="size-4 shrink-0" />
            <p>{errors.root.message}</p>
          </div>
        )}

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
                className={cn(
                  "rounded-md",
                  errors.email && "border-red-500 focus-visible:ring-red-500",
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
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
              <div className="flex flex-col">
                <Input
                  value={value}
                  onChange={onChange}
                  id="password"
                  type="password"
                  className={cn(
                    "rounded-md",
                    errors.password &&
                      "border-red-500 focus-visible:ring-red-500",
                  )}
                />
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}
          />
        </Field>

        <Field>
          <Button type="submit" className="rounded-md" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 size-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </Field>

        <FieldSeparator className="bg-surface!">
          Or continue with
        </FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            className="rounded-md"
            disabled={isLoading}
          >
            <Image
              alt="Google icon"
              priority
              src={googleIcon}
              className="size-4 mr-2"
            />
            Login with Google
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
