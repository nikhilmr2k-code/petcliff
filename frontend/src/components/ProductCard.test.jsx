import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductCard from "./ProductCard";
import { CartProvider } from "../context/CartContext";

const product = {
  id: "p1", name: "Tactical Harness Set", price: 68, rating: 5,
  pet: "dog", color: "Black", image: "https://example.com/x.jpg", stock: 50,
};

describe("ProductCard", () => {
  it("renders the product name and formatted price", () => {
    render(
      <CartProvider>
        <ProductCard product={product} />
      </CartProvider>
    );
    expect(screen.getByText("Tactical Harness Set")).toBeInTheDocument();
    expect(screen.getByText("$68.00")).toBeInTheDocument();
  });
});
