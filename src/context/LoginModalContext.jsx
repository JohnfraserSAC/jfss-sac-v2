import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoginModal } from "../components/auth/LoginModal";
import { useAuth } from "./AuthContext";
import {
  consumeAuthReturnTo,
  rememberAuthReturnTo,
} from "../utils/authRedirect";

const LoginModalContext = createContext(null);

export function LoginModalProvider({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const handledAuthRef = useRef(false);

  const openLoginModal = useCallback((returnTo) => {
    if (returnTo) {
      rememberAuthReturnTo(returnTo);
    } else {
      rememberAuthReturnTo(
        `${location.pathname}${location.search}${location.hash}`,
      );
    }
    setOpen(true);
  }, [location.hash, location.pathname, location.search]);

  const closeLoginModal = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      handledAuthRef.current = false;
      return;
    }
    if (isLoading || handledAuthRef.current) return;

    handledAuthRef.current = true;
    setOpen(false);

    const returnTo = consumeAuthReturnTo(null);
    if (!returnTo) return;

    const current = `${location.pathname}${location.search}${location.hash}`;
    if (returnTo !== current) {
      navigate(returnTo, { replace: true });
    }
  }, [
    isAuthenticated,
    isLoading,
    location.hash,
    location.pathname,
    location.search,
    navigate,
  ]);

  const value = useMemo(
    () => ({
      isLoginModalOpen: open,
      openLoginModal,
      closeLoginModal,
    }),
    [open, openLoginModal, closeLoginModal],
  );

  return (
    <LoginModalContext.Provider value={value}>
      {children}
      <LoginModal open={open} onClose={closeLoginModal} />
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const value = useContext(LoginModalContext);
  if (!value) {
    throw new Error("useLoginModal must be used within LoginModalProvider.");
  }
  return value;
}
