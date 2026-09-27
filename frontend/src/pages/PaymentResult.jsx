import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function PaymentResult() {
  const { result } = useParams();
  const { clearCart } = useCart();
  const success = result === "success";

  useEffect(() => {
    if (success) clearCart();
  }, [success, clearCart]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-24 text-center" data-testid="payment-result">
      {success ? (
        <CheckCircle2 size={56} strokeWidth={1.2} />
      ) : (
        <XCircle size={56} strokeWidth={1.2} />
      )}
      <h1 className="mt-6 font-display text-3xl font-black tracking-tight">
        {success ? "ORDER CONFIRMED" : "PAYMENT CANCELLED"}
      </h1>
      <p className="mt-3 max-w-sm text-sm text-steel">
        {success
          ? "Thank you — your order is confirmed. A receipt is on its way to your inbox."
          : "Your payment was not completed. Your cart has been kept so you can try again."}
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="border border-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-paper">
          Continue Shopping
        </Link>
        {success && (
          <Link to="/account" className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-paper transition-colors hover:bg-neutral-800">
            View Orders
          </Link>
        )}
      </div>
    </main>
  );
}
