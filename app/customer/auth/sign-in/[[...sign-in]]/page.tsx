import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return <SignIn forceRedirectUrl="/customer/orders" signUpUrl="/customer/auth/sign-up" />;
}
