"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Link from "next/link";
import api from "@/lib/api";
import type { AxiosError } from "axios";

export default function Signup() {
  const [email, setemail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
  try {
    const res = await api.post("/user/signup", {
  email,
  name,
  password,
});

    localStorage.setItem("token", res.data.token);
    router.push("/dashboard");

  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    console.error(axiosError.response?.data || axiosError.message);
  }

  };

  return (
    <Card title="Create Account">
      <Input
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setemail(e.target.value)
        }
        placeholder="email"
      />
        <Input
        value={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setName(e.target.value)
        }
        placeholder="Full name"
      />
      <Input
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setPassword(e.target.value)
        }
        placeholder="Password"
        type="password"
      />

      <Button
        onClick={handleSignup}
      >
        Sign Up
      </Button>

      <p className="text-gray-400 text-sm mt-4 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-500">
          Login
        </Link>
      </p>
    </Card>
  );
}
