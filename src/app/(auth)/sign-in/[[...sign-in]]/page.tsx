"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { useState } from "react";

export default function SignInPage() {
  const [imgSrc, setImgSrc] = useState("/inventory-logo.svg");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md p-6">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          {/* Logo con manejo de errores */}
          <div className="mx-auto mb-4">
            <Image
              src={imgSrc}
              alt="Logo"
              width={80}
              height={80}
              priority
              onError={() => setImgSrc("/next.svg")}
            />
          </div>
          
          <h1 className="text-3xl font-bold">Iniciar Sesión</h1>
          <p className="text-muted-foreground mt-2">
            Accede a tu cuenta para gestionar tu inventario
          </p>
        </div>
        
        <div className="bg-card border rounded-lg shadow-sm">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none border-0",
                header: "hidden",
                footer: "hidden"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
} 