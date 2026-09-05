"use client";

import frontpageImg from "@/assets/frontpage.jpg";
import logoImg from "@/assets/h_final_logo.png";
import { LoginForm } from "@/components/login-form";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    router.replace("/dashboard");
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-white text-primary-foreground overflow-hidden p-1">
              <Image
                alt="H Breakfast to bar"
                src={logoImg}
                className="size-full object-contain"
              />
            </div>
            H Breakfast to Bar.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src={frontpageImg}
          alt="Frontpage background"
          fill
          sizes="50vw"
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          priority
        />
      </div>
    </div>
  );
}
