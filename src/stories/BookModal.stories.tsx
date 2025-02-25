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
      description: "A hobbit's unexpected journey through Middle-earth.",
      createdAt: new Date(),
      updatedAt: new Date(),
      coverOptions: [
        {
          description: "A green hill with a round door, surrounded by a garden",
          style: "watercolor"
        },
        {
          description: "A dragon sleeping on a pile of gold",
          style: "digital art"
        },
        {
          description: "A map of Middle-earth with runes and decorative borders",
          style: "ink drawing"
        }
      ]
    },
    onClose: () => console.log("Modal closed")
  },
};

export const WithDescription: Story = {
  args: {
    book: {
      id: "2",
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      description: "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort.",
      lexileScore: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
      coverOptions: [
        {
          description: "A cozy hobbit-hole interior with a warm fireplace",
          style: "watercolor"
        },
        {
          description: "Bilbo and Gandalf discussing adventure over tea",
          style: "oil painting"
        },
        {
          description: "The Lonely Mountain at sunset",
          style: "digital art"
        }
      ]
    },
    onClose: () => console.log("Modal closed")
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
      coverOptions: [
        {
          description: "The One Ring with Elvish inscriptions glowing",
          style: "digital art"
        },
        {
          description: "The Fellowship walking through Moria",
          style: "oil painting"
        },
        {
          description: "The Gates of Moria at night",
          style: "ink and watercolor"
        }
      ]
    },
    onClose: () => console.log("Modal closed")
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
      coverOptions: [
        {
          description: "A mysterious closed book with a lock",
          style: "digital art"
        }
      ]
    },
    onClose: () => console.log("Modal closed")
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
      coverOptions: [
        {
          description: "A detailed academic illustration of Smaug",
          style: "classical illustration"
        },
        {
          description: "Ancient manuscript style map of the Lonely Mountain",
          style: "medieval manuscript"
        }
      ]
    },
    onClose: () => console.log("Modal closed")
  },
}; 