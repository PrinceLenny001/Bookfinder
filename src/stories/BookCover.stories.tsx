import type { Meta, StoryObj } from "@storybook/react";
import { BookCover } from "@/components/BookCover";

const meta: Meta<typeof BookCover> = {
  title: "Components/BookCover",
  component: BookCover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BookCover>;

export const Default: Story = {
  args: {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    className: "w-48",
  },
};

export const WithFallback: Story = {
  args: {
    title: "Non-existent Book",
    author: "Unknown Author",
    className: "w-48",
  },
};

export const WithClick: Story = {
  args: {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    className: "w-48",
    onClick: () => alert("Book clicked!"),
  },
}; 