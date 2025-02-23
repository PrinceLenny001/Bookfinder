import type { Meta, StoryObj } from "@storybook/react";
import { BookModal } from "@/components/BookModal";

const meta = {
  title: "Components/BookModal",
  component: BookModal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof BookModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    book: {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
    },
    onClose: () => {},
  },
};

export const WithDescription: Story = {
  args: {
    book: {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      description: "A fantasy novel about a hobbit who goes on an unexpected journey.",
    },
    onClose: () => {},
  },
};

export const WithoutDescription: Story = {
  args: {
    book: {
      title: "Sample Book",
      author: "Sample Author",
    },
    onClose: () => {},
  },
};

export const Closed: Story = {
  args: {
    book: null,
    onClose: () => {},
  },
}; 