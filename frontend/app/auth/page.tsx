"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/rest";
import { useAuthStore } from "@/store/auth";

export default function AuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const loginMutation = useMutation({
    mutationFn: (formData: FormData) => login(String(formData.get("email")), String(formData.get("password"))),
    onSuccess: (auth) => {
      setAuth(auth);
      router.push("/hotels");
    }
  });

  const registerMutation = useMutation({
    mutationFn: (formData: FormData) => register(String(formData.get("name")), String(formData.get("email")), String(formData.get("password"))),
    onSuccess: (auth) => {
      setAuth(auth);
      router.push("/hotels");
    }
  });

  return (
    <main className="page">
      <div className="section-title">
        <h1>Login / Register</h1>
        <p className="muted">Demo users: user@hotelhub.local / user123, admin@hotelhub.local / admin123</p>
      </div>
      <div className="grid">
        <form className="form" action={(formData) => loginMutation.mutate(formData)}>
          <h2>Login</h2>
          <label>Email<input name="email" type="email" defaultValue="user@hotelhub.local" required /></label>
          <label>Password<input name="password" type="password" defaultValue="user123" required /></label>
          <button className="btn primary">Login</button>
          {loginMutation.error ? <p>{loginMutation.error.message}</p> : null}
        </form>
        <form className="form" action={(formData) => registerMutation.mutate(formData)}>
          <h2>Register</h2>
          <label>Name<input name="name" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" minLength={6} required /></label>
          <button className="btn primary">Create account</button>
          {registerMutation.error ? <p>{registerMutation.error.message}</p> : null}
        </form>
      </div>
    </main>
  );
}
