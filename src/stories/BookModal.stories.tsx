import type { Meta, StoryObj } from "@storybook/react";
import { BookModal } from "@/components/BookModal";

const meta: Meta<typeof BookModal> = {
  component: BookModal,
  title: "Components/BookModal",
};

export default meta;
type Story = StoryObj<typeof BookModal>;

export const Default: Story = {
  args: {
    book: {
      id: "1",
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      lexileScore: 1000,
      description: "A fantasy novel about a hobbit who goes on an unexpected journey.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    onClose: () => {},
  },
};

export const WithDescription: Story = {
  args: {
    book: {
      id: "2",
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      description: "A fantasy novel about a hobbit who goes on an unexpected journey.",
      lexileScore: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    onClose: () => {},
  },
};

export const WithLongTitle: Story = {
  args: {
    book: {
      id: "3",
      title: "The Fellowship of the Ring: Being the First Part of The Lord of the Rings",
      author: "J.R.R. Tolkien",
      lexileScore: 1000,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    onClose: () => {},
  },
};

export const Closed: Story = {
  args: {
    book: {
      id: "4",
      title: "Hidden Book",
      author: "Hidden Author",
      lexileScore: 1000,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    onClose: () => {},
  },
};

export const WithLongAuthor: Story = {
  args: {
    book: {
      id: "5",
      title: "The Hobbit",
      author: "John Ronald Reuel Tolkien, CBE, FRSL, Professor of Anglo-Saxon at Oxford University",
      lexileScore: 1000,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    onClose: () => {},
  },
}; 