"use client";

import { type User } from "better-auth";
import Image from "next/image";
import SignOutForm from "./signout-form";

export default function UserProfile({ user }: { user: User }) {
  return (
    <div className="flex items-start gap-5">
      <div className="flex cursor-pointer items-center">
        <div>
          {user.image ? (
            <Image
              alt={user.name ?? "user image"}
              src={user.image}
              className="inline-block size-9 rounded-full"
              width={24}
              height={24}
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-black">
              {user.name?.charAt(0)}
            </div>
          )}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-100 group-hover:text-gray-200">
            {user.name}
          </p>
          <p className="text-xs font-medium text-gray-500 group-hover:text-gray-600">
            {user.email}
          </p>
        </div>
      </div>
      <SignOutForm />
    </div>
  );
}
