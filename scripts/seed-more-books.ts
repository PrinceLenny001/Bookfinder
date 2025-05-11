import { prisma } from "../src/lib/db";

const additionalBooks = [
  {
    title: "The Hunger Games",
    author: "Suzanne Collins",
    lexileScore: 810,
    description: "In a dystopian future, Katniss Everdeen volunteers to take her sister's place in the Hunger Games, a televised competition where children fight to the death."
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    lexileScore: 880,
    description: "Harry Potter discovers he's a wizard and begins his journey at Hogwarts School of Witchcraft and Wizardry."
  },
  {
    title: "The Lightning Thief",
    author: "Rick Riordan",
    lexileScore: 740,
    description: "Percy Jackson discovers he's a demigod and must prevent a war between the Greek gods."
  },
  {
    title: "Bridge to Terabithia",
    author: "Katherine Paterson",
    lexileScore: 810,
    description: "Two children create a magical kingdom in the woods and learn about friendship and loss."
  },
  {
    title: "The Fault in Our Stars",
    author: "John Green",
    lexileScore: 850,
    description: "Two teenagers with cancer fall in love and embark on a journey to meet their favorite author."
  },
  {
    title: "The Maze Runner",
    author: "James Dashner",
    lexileScore: 770,
    description: "Thomas wakes up in a mysterious maze with no memory of his past, surrounded by other boys trying to escape."
  },
  {
    title: "Divergent",
    author: "Veronica Roth",
    lexileScore: 700,
    description: "In a dystopian Chicago, society is divided into five factions, and Beatrice must choose where she belongs."
  },
  {
    title: "The Book Thief",
    author: "Markus Zusak",
    lexileScore: 730,
    description: "A young girl in Nazi Germany learns to read and shares books with her neighbors and a Jewish man hiding in her basement."
  },
  {
    title: "The Perks of Being a Wallflower",
    author: "Stephen Chbosky",
    lexileScore: 720,
    description: "Charlie navigates high school, friendship, and mental health through a series of letters."
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    lexileScore: 910,
    description: "A young shepherd embarks on a journey to find a worldly treasure and discovers his personal legend."
  },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    lexileScore: 790,
    description: "Holden Caulfield recounts his experiences in New York City after being expelled from prep school."
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    lexileScore: 870,
    description: "Scout Finch's father defends a Black man accused of a serious crime in the American South."
  },
  {
    title: "The Outsiders",
    author: "S.E. Hinton",
    lexileScore: 750,
    description: "Ponyboy Curtis navigates the conflict between two rival gangs in 1960s Oklahoma."
  },
  {
    title: "The Diary of a Young Girl",
    author: "Anne Frank",
    lexileScore: 1080,
    description: "Anne Frank's diary chronicles her life in hiding during the Nazi occupation of the Netherlands."
  },
  {
    title: "The Giver",
    author: "Lois Lowry",
    lexileScore: 760,
    description: "Jonas lives in a seemingly perfect society until he's chosen to be the Receiver of Memory."
  },
  {
    title: "Number the Stars",
    author: "Lois Lowry",
    lexileScore: 670,
    description: "A young Danish girl helps her Jewish friend escape from the Nazis during World War II."
  },
  {
    title: "The Watsons Go to Birmingham",
    author: "Christopher Paul Curtis",
    lexileScore: 920,
    description: "A family's road trip to Birmingham, Alabama, during the Civil Rights Movement."
  },
  {
    title: "Esperanza Rising",
    author: "Pam Muñoz Ryan",
    lexileScore: 750,
    description: "A young girl's journey from Mexico to California during the Great Depression."
  },
  {
    title: "Bud, Not Buddy",
    author: "Christopher Paul Curtis",
    lexileScore: 950,
    description: "A young boy's search for his father during the Great Depression."
  },
  {
    title: "The Westing Game",
    author: "Ellen Raskin",
    lexileScore: 750,
    description: "Sixteen people are invited to solve the mystery of a millionaire's death."
  },
  {
    title: "A Wrinkle in Time",
    author: "Madeleine L'Engle",
    lexileScore: 740,
    description: "Meg Murry and her friends travel through space and time to rescue her father."
  },
  {
    title: "The Phantom Tollbooth",
    author: "Norton Juster",
    lexileScore: 1000,
    description: "A bored boy discovers a magical tollbooth that transports him to the Kingdom of Wisdom."
  },
  {
    title: "Island of the Blue Dolphins",
    author: "Scott O'Dell",
    lexileScore: 1000,
    description: "A young girl survives alone on an island for eighteen years."
  },
  {
    title: "The True Confessions of Charlotte Doyle",
    author: "Avi",
    lexileScore: 740,
    description: "A young girl's journey across the Atlantic becomes a tale of adventure and courage."
  },
  {
    title: "The Sign of the Beaver",
    author: "Elizabeth George Speare",
    lexileScore: 770,
    description: "A young boy survives in the wilderness with the help of a Native American friend."
  },
  {
    title: "Tuck Everlasting",
    author: "Natalie Babbitt",
    lexileScore: 770,
    description: "A young girl discovers a family with the secret of eternal life."
  },
  {
    title: "The View from Saturday",
    author: "E.L. Konigsburg",
    lexileScore: 870,
    description: "Four sixth-graders form an academic team and learn about friendship and success."
  },
  {
    title: "The Midwife's Apprentice",
    author: "Karen Cushman",
    lexileScore: 1240,
    description: "A homeless girl becomes an apprentice to a midwife in medieval England."
  },
  {
    title: "The Tale of Despereaux",
    author: "Kate DiCamillo",
    lexileScore: 670,
    description: "A brave mouse, a rat, a serving girl, and a princess come together in an unusual adventure."
  },
  {
    title: "Because of Winn-Dixie",
    author: "Kate DiCamillo",
    lexileScore: 610,
    description: "A young girl and her dog make friends in a new town."
  }
];

async function main() {
  try {
    console.log("Adding 30 new books to the database...");
    
    // Add books to database
    for (const book of additionalBooks) {
      // Check if book already exists
      const existingBook = await prisma.book.findFirst({
        where: {
          title: book.title,
          author: book.author
        }
      });
      
      if (!existingBook) {
        await prisma.book.create({
          data: book
        });
        console.log(`Added "${book.title}" by ${book.author}`);
      } else {
        console.log(`Skipped "${book.title}" by ${book.author} (already exists)`);
      }
    }
    
    // Get total count
    const totalBooks = await prisma.book.count();
    console.log(`\nDatabase now contains ${totalBooks} books total.`);
    
  } catch (error) {
    console.error("Error adding books:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 