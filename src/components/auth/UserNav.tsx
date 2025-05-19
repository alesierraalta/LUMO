"use client";

import { 
  SignedIn, 
  SignedOut, 
  UserButton, 
  SignInButton,
  useUser,
  useClerk
} from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";
import Link from "next/link";
import { useAppAuth } from "./auth-provider";

export function UserNav() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { userRole } = useAppAuth();
  
  return (
    <div className="flex items-center gap-2">
      <SignedIn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8"
                  }
                }}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
                {userRole && (
                  <p className="text-xs leading-none text-primary capitalize mt-1">
                    Rol: {userRole}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/settings/profile">
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => signOut(() => { window.location.href = '/'; })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="outline" size="sm">
            Iniciar sesión
          </Button>
        </SignInButton>
      </SignedOut>
    </div>
  );
} 