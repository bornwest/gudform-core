import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import Link from "next/link";

import { Modal } from "@/components/ui/modal";
import { UserAuthForm } from "@/components/forms/user-auth-form";
import { Icons } from "@/components/shared/icons";

function SignInModal({
  showSignInModal,
  setShowSignInModal,
}: {
  showSignInModal: boolean;
  setShowSignInModal: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <Modal showModal={showSignInModal} setShowModal={setShowSignInModal} title="Sign In">
      <div className="w-full bg-background px-4 py-8 md:px-8">
        <div className="mx-auto flex w-full max-w-[350px] flex-col justify-center space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <Icons.logo className="mx-auto size-6" />
            <h3 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to sign in to your account
            </p>
          </div>
          <UserAuthForm onSuccess={() => setShowSignInModal(false)} />
          <p className="px-8 text-center text-sm text-muted-foreground">
            <Link
              href="/register"
              className="hover:text-brand underline underline-offset-4"
              onClick={() => setShowSignInModal(false)}
            >
              Don&apos;t have an account? Sign Up
            </Link>
          </p>
        </div>
      </div>
    </Modal>
  );
}

export function useSignInModal() {
  const [showSignInModal, setShowSignInModal] = useState(false);

  const SignInModalCallback = useCallback(() => {
    return (
      <SignInModal
        showSignInModal={showSignInModal}
        setShowSignInModal={setShowSignInModal}
      />
    );
  }, [showSignInModal, setShowSignInModal]);

  return useMemo(
    () => ({
      setShowSignInModal,
      SignInModal: SignInModalCallback,
    }),
    [setShowSignInModal, SignInModalCallback],
  );
}
