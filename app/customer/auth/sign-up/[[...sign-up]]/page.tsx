import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return <SignUp forceRedirectUrl="/customer/orders" signInUrl="/customer/auth/sign-in" />;
}
