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
      lexileScore: 1000,
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
      lexileScore: 1000,
    },
    onClose: () => {},
  },
};

export const WithLongTitle: Story = {
  args: {
    book: {
      title: "The Fellowship of the Ring: Being the First Part of The Lord of the Rings",
      author: "J.R.R. Tolkien",
      lexileScore: 1000,
    },
    onClose: () => {},
  },
};

export const Closed: Story = {
  args: {
    book: {
      title: "Hidden Book",
      author: "Hidden Author",
      lexileScore: 1000,
    },
    onClose: () => {},
  },
};

export const WithLongAuthor: Story = {
  args: {
    book: {
      title: "The Hobbit",
      author: "John Ronald Reuel Tolkien, CBE, FRSL, Professor of Anglo-Saxon at Oxford University",
      lexileScore: 1000,
    },
    onClose: () => {},
  },
}; 