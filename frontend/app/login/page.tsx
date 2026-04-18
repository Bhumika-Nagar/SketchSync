"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Link from "next/link";
import api from "@/lib/api";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
  try {
    const res = await api.post("/user/signin", {
      email,
      name,
      password,
    });

    localStorage.setItem("accessToken", res.data.token);
    router.push("/dashboard");

  } catch (error: any) {
    console.error(error.response?.data || error.message);
  }
    
  };

  return (
    <Card title="Welcome Back">
      <Input
        value={email}
        onChange={(e: any) => setEmail(e.target.value)}
        placeholder="Email"
      />
        <Input
        value={name}
        onChange={(e: any) => setName(e.target.value)}
        placeholder="Full name"
        />     
      <Input
        value={password}
        onChange={(e: any) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
      />

      <Button
        onClick={handleLogin}
      >
        Login
      </Button>

      <p className="text-gray-400 text-sm mt-4 text-center">
        Don’t have an account?{" "}
        <Link href="/signup" className="text-blue-500">
          Sign Up
        </Link>
      </p>
    </Card>
  );
}