// Language Test — original reading-comprehension passages (JNVST style:
// read a passage, answer 5 questions). The FIRST option is always correct
// here; build.mjs shuffles the options.
import { arrange, uuidFrom } from "./lib.mjs";

export const LANG_TOPICS = {
  facts: "Comprehension: Facts and Details",
  main: "Comprehension: Main Idea and Title",
  vocab: "Comprehension: Word Meanings",
  infer: "Comprehension: Inference",
  grammar: "Comprehension: Grammar and Usage",
};

const P = [
  {
    title: "The Rain Gauge",
    text: `Lakshmi lived in a small village where most people were farmers. Every year the farmers argued about how much rain had fallen. One day Lakshmi's science teacher showed the class how to make a rain gauge from a plastic bottle and a ruler. Lakshmi made one and placed it in an open space behind her house, away from trees. Each morning she measured the water, wrote the number in a notebook and emptied the bottle. At the end of the monsoon, she showed her notebook at the village meeting. The farmers were surprised to see that July had received twice as much rain as June. From then on, they asked Lakshmi before deciding when to sow their seeds.`,
    qs: [
      ["facts", "Where did Lakshmi place the rain gauge?", ["In an open space away from trees", "Under a big tree", "Inside the school", "On the roof of the temple"]],
      ["facts", "What did Lakshmi do after measuring the water each morning?", ["She wrote the number and emptied the bottle", "She gave the water to the plants", "She told her teacher at once", "She left the water in the bottle"]],
      ["infer", "Why did the farmers start asking Lakshmi before sowing seeds?", ["Her records showed how much rain fell each month", "She owned the largest farm", "She could predict the future", "Her teacher told them to"]],
      ["vocab", "The word 'surprised' in the passage is closest in meaning to", ["astonished", "angry", "bored", "frightened"]],
      ["main", "Which is the best title for the passage?", ["A Useful Notebook", "The Angry Farmers", "A Trip to the Market", "The Broken Bottle"]],
    ],
  },
  {
    title: "Honeybees",
    text: `Honeybees live together in large groups called colonies. A colony has one queen, a few hundred drones and thousands of worker bees. The queen lays all the eggs. The worker bees, which are all female, do almost every other job. They clean the hive, feed the young bees, guard the entrance and collect nectar and pollen from flowers. When a worker finds a good patch of flowers, she returns to the hive and performs a special 'waggle dance'. The direction and length of the dance tell the other bees where the flowers are. While collecting nectar, bees carry pollen from one flower to another. This helps plants produce fruits and seeds, so bees are very important for farmers.`,
    qs: [
      ["facts", "Who lays all the eggs in a colony?", ["The queen", "The worker bees", "The drones", "The guard bees"]],
      ["facts", "How do worker bees tell others where flowers are?", ["By doing a waggle dance", "By buzzing loudly", "By bringing back a flower", "By changing colour"]],
      ["infer", "Why are bees important for farmers?", ["They help plants make fruits and seeds", "They guard the fields", "They eat harmful insects", "They make the soil soft"]],
      ["grammar", "In 'The worker bees, which are all female, do almost every other job', the word 'which' refers to", ["the worker bees", "the queen", "the flowers", "the drones"]],
      ["main", "The passage is mainly about", ["how honeybees live and work together", "how to make honey at home", "why bees sting people", "the colours of flowers"]],
    ],
  },
  {
    title: "The Boy from Rameswaram",
    text: `A. P. J. Abdul Kalam was born in 1931 in Rameswaram, a small town on an island in Tamil Nadu. His family was not rich, so as a young boy he helped by distributing newspapers early in the morning before school. He loved watching birds fly and wondered how they could rise so easily into the sky. His teachers noticed his curiosity and encouraged him to study hard. Kalam later became a scientist and worked on India's space and missile programmes. In 2002 he became the President of India. Even then, he loved meeting students and often told them to dream big and work hard to make their dreams come true.`,
    qs: [
      ["facts", "Where was Abdul Kalam born?", ["Rameswaram", "Chennai", "Delhi", "Mumbai"]],
      ["facts", "What did young Kalam do to help his family?", ["He distributed newspapers", "He sold fruits", "He worked in a field", "He mended shoes"]],
      ["infer", "Watching birds fly made young Kalam", ["curious about flying", "afraid of heights", "want to keep birds as pets", "stop going to school"]],
      ["vocab", "The word 'encouraged' means", ["gave support and hope", "punished", "laughed at", "ignored"]],
      ["grammar", "Which of these words is an adjective?", ["small", "born", "quickly", "and"]],
    ],
  },
  {
    title: "The Mangrove Forest",
    text: `The Sundarbans is a huge mangrove forest where the rivers Ganga and Brahmaputra meet the Bay of Bengal. Mangroves are trees that can grow in salty water. Their roots grow above the mud like thin fingers so that they can breathe when the tide is high. The forest protects villages along the coast because the thick trees slow down strong winds and waves during storms. The Sundarbans is famous as the home of the Royal Bengal tiger, which is a good swimmer. Crocodiles, deer, monkeys and many kinds of birds also live there. Today people are working to protect the forest, because without it both the animals and the villagers would be in danger.`,
    qs: [
      ["facts", "Mangrove trees can grow in", ["salty water", "dry sand only", "snow", "rocky mountains"]],
      ["facts", "Why do some mangrove roots grow above the mud?", ["To breathe when the tide is high", "To catch fish", "To hold up birds' nests", "To collect sunlight"]],
      ["infer", "How does the forest protect coastal villages?", ["It slows down strong winds and waves", "It gives them electricity", "It keeps tigers away", "It makes the sea less salty"]],
      ["vocab", "The opposite of 'huge' is", ["tiny", "large", "thick", "wide"]],
      ["main", "Which is the best title for the passage?", ["A Forest that Protects", "Life in a Desert", "The Highest Mountain", "Fishing in the River"]],
    ],
  },
  {
    title: "Kites over Ahmedabad",
    text: `In January, on the festival of Makar Sankranti, the sky over Ahmedabad fills with thousands of colourful kites. Weeks before the festival, families buy paper kites and spools of strong string called 'manja'. On the festival day, people climb onto their rooftops early in the morning. Neighbours shout 'Kai po che!' whenever they cut someone else's kite. Children run through the lanes to catch the kites that float down. In the evening, some people fly paper lanterns that glow in the dark sky. Doctors and animal lovers also remind everyone to be careful, because sharp kite strings can hurt birds. Many volunteers set up camps to treat injured birds during the festival.`,
    qs: [
      ["facts", "When is Makar Sankranti celebrated?", ["In January", "In June", "In October", "In December"]],
      ["facts", "What do people shout when they cut someone's kite?", ["Kai po che!", "Happy Diwali!", "Jai Ho!", "Well done!"]],
      ["infer", "Why do volunteers set up camps during the festival?", ["To treat birds hurt by kite strings", "To sell kites", "To teach kite flying", "To stop the festival"]],
      ["grammar", "In 'Children run through the lanes', the verb is", ["run", "children", "through", "lanes"]],
      ["vocab", "The word 'glow' means", ["shine softly", "fall down", "break apart", "make noise"]],
    ],
  },
  {
    title: "The Journey of a Water Drop",
    text: `The water in our rivers, lakes and seas is always moving. When the sun heats the sea, tiny drops of water change into water vapour and rise into the air. This is called evaporation. High above the ground the air is cool, so the vapour turns back into tiny droplets that join together to form clouds. This is called condensation. When the droplets become too heavy, they fall to the ground as rain, or as snow in very cold places. Rainwater flows into streams and rivers and finally reaches the sea again. This never-ending journey is called the water cycle. Because of the water cycle, the same water has been used again and again for millions of years.`,
    qs: [
      ["facts", "What is evaporation?", ["Water changing into vapour and rising", "Clouds turning into rain", "Rain flowing into rivers", "Water freezing into ice"]],
      ["facts", "Clouds are formed when water vapour", ["cools and turns into droplets", "becomes hotter", "falls on mountains", "mixes with soil"]],
      ["infer", "Snow falls instead of rain in places that are", ["very cold", "very hot", "near the sea", "full of trees"]],
      ["vocab", "The word 'never-ending' means", ["continuous", "short", "sudden", "finished"]],
      ["main", "The passage mainly explains", ["the water cycle", "how to save water", "how rivers are named", "why the sea is salty"]],
    ],
  },
  {
    title: "The Village Library",
    text: `There was no library in Sonpur, so the children had very few books to read. Ramesh, a retired teacher, decided to do something about it. He cleaned an empty room in the panchayat building and put up a sign that said 'Library – Open to All'. At first he had only his own fifty books. Then he wrote letters to his old students, who were now living in different cities. Parcels of books began to arrive every week. Soon the room had more than a thousand books. Children came every evening after school, and even some grandparents learned to read there. Ramesh smiled and said, 'A book is a friend that never leaves you.'`,
    qs: [
      ["facts", "Who started the library in Sonpur?", ["Ramesh, a retired teacher", "The village headman", "A group of children", "A city officer"]],
      ["facts", "How many books did the library have at first?", ["Fifty", "One thousand", "Five hundred", "Ten"]],
      ["infer", "Why did parcels of books start arriving?", ["Ramesh had written to his old students", "The government sent them", "Children bought them", "A shop gave them free"]],
      ["grammar", "Which of these is a proper noun from the passage?", ["Sonpur", "library", "teacher", "books"]],
      ["main", "What does Ramesh mean by 'A book is a friend that never leaves you'?", ["Books are always there to help and teach us", "Books cannot be borrowed", "Friends should read books", "Books are very heavy"]],
    ],
  },
  {
    title: "Ship of the Desert",
    text: `The camel is often called the 'ship of the desert' because it can carry people and goods across hot, sandy deserts for long distances. A camel can go without drinking water for many days. When it finally finds water, it can drink a very large amount in a few minutes. Its hump stores fat, not water as many people think. The fat gives the camel energy when food is hard to find. Camels have long eyelashes and can close their nostrils to keep out blowing sand. Their wide, padded feet do not sink into the soft sand. In Rajasthan, camels are still used by many families for farming, transport and even for racing at fairs.`,
    qs: [
      ["facts", "What does a camel's hump store?", ["Fat", "Water", "Sand", "Milk"]],
      ["facts", "Why do camels' feet not sink into soft sand?", ["They are wide and padded", "They are very small", "They have sharp claws", "They are made of hair"]],
      ["infer", "The camel is called the 'ship of the desert' because it", ["carries people and goods across the desert", "can swim in water", "is shaped like a boat", "lives near the sea"]],
      ["vocab", "Which word means the same as 'goods'?", ["things to carry", "good people", "kind acts", "food only"]],
      ["grammar", "Choose the correct plural form used in the passage.", ["eyelashes", "eyelash's", "eyelashs", "eyelashies"]],
    ],
  },
  {
    title: "The Clever Shepherd",
    text: `A shepherd boy named Bhola took his goats to graze near a forest every day. One afternoon he saw dark clouds and heard the river roaring louder than usual. Bhola noticed that the water was rising quickly and that the small bridge to the village was in danger. Instead of running home alone, he gathered his goats and led them to a hill. Then he climbed a tall tree and waved his red cloth to warn the people working in the fields. The farmers saw the signal and moved to higher ground just before the river flooded the fields. That evening the whole village thanked Bhola for his presence of mind.`,
    qs: [
      ["facts", "What did Bhola use to warn the farmers?", ["A red cloth", "A drum", "A whistle", "A letter"]],
      ["facts", "Where did Bhola take his goats when the water rose?", ["To a hill", "Across the bridge", "Into the forest", "Back to the river"]],
      ["vocab", "'Presence of mind' means", ["the ability to think quickly and act wisely", "being present in class", "having a good memory", "feeling very afraid"]],
      ["infer", "What would probably have happened if Bhola had not warned the farmers?", ["They could have been caught in the flood", "They would have gone to the market", "The river would have dried up", "The goats would have run away"]],
      ["main", "Which is the best title for the story?", ["Bhola Saves the Village", "The Lazy Goat", "A Day at the Fair", "The Lost Red Cloth"]],
    ],
  },
  {
    title: "Food from Sunlight",
    text: `Animals have to find their food, but green plants make their own. Plants take in water from the soil through their roots. They take in a gas called carbon dioxide from the air through tiny holes in their leaves. The green colouring in leaves, called chlorophyll, uses the energy of sunlight to turn water and carbon dioxide into food. This process is called photosynthesis. While making food, plants give out oxygen, which humans and animals need to breathe. That is why forests are sometimes called the lungs of the Earth. Without green plants, there would be no food for animals and no fresh oxygen in the air.`,
    qs: [
      ["facts", "Through which part do plants take in water?", ["Roots", "Flowers", "Leaves", "Fruits"]],
      ["facts", "What is chlorophyll?", ["The green colouring in leaves", "A kind of soil", "A gas in the air", "A type of root"]],
      ["infer", "Forests are called the 'lungs of the Earth' because they", ["give out oxygen", "are very large", "have many animals", "grow near rivers"]],
      ["vocab", "The word 'process' in the passage means", ["a series of steps", "a quick game", "a kind of plant", "a big forest"]],
      ["grammar", "In 'Plants take in water', the subject is", ["Plants", "take", "in", "water"]],
    ],
  },
  {
    title: "Grandmother's Garden",
    text: `Every summer holiday, Neha visited her grandmother in Nashik. Behind the house was a small garden full of tomatoes, chillies, brinjals and a big guava tree. Grandmother woke up at sunrise to water the plants, and Neha soon began to help her. She learned that dried leaves and vegetable peels could be put in a pit to make compost, a natural manure for the soil. Grandmother never used chemical sprays. Instead, she planted marigold flowers between the vegetables to keep some insects away. By the end of the holiday, Neha had planted her own row of spinach. When she went home, she started a small kitchen garden on her balcony.`,
    qs: [
      ["facts", "What is compost made from, according to the passage?", ["Dried leaves and vegetable peels", "Plastic and paper", "Stones and sand", "Chemical sprays"]],
      ["facts", "Why did Grandmother plant marigolds between the vegetables?", ["To keep some insects away", "To sell them", "To make the garden smell nice", "To feed the cows"]],
      ["infer", "What can we say about Neha at the end of the story?", ["She enjoyed gardening and wanted to continue it", "She disliked her grandmother's garden", "She never wanted to visit again", "She was afraid of insects"]],
      ["vocab", "'Natural manure' is something that", ["makes soil rich without chemicals", "kills plants", "is bought in a factory", "makes water salty"]],
      ["grammar", "Which word is a verb in the past tense?", ["planted", "garden", "small", "natural"]],
    ],
  },
  {
    title: "The Postman's Bicycle",
    text: `Hari Kaka was the postman of three villages. For thirty years he rode an old bicycle on dusty roads, carrying letters, money orders and parcels. People waited for him eagerly, because a letter could bring news of a wedding, a new job or a newborn baby. Many old people could not read, so Hari Kaka often read the letters aloud to them and even helped them write replies. When mobile phones came, fewer letters were sent, but Hari Kaka's work did not stop. He now delivered bank documents, school books and medicines. On the day he retired, the villagers gave him a new bicycle with a bell that rang loudly, and everyone clapped.`,
    qs: [
      ["facts", "For how many years did Hari Kaka ride his old bicycle?", ["Thirty years", "Three years", "Ten years", "Fifty years"]],
      ["facts", "How did Hari Kaka help people who could not read?", ["He read the letters aloud to them", "He gave them books", "He took them to school", "He sent their letters back"]],
      ["infer", "What does the gift of a new bicycle show?", ["The villagers loved and respected him", "The old bicycle was stolen", "He wanted to become a racer", "The village had too many bicycles"]],
      ["vocab", "The word 'eagerly' means", ["with great interest", "slowly", "angrily", "sadly"]],
      ["main", "The passage is mainly about", ["a postman who served his villages faithfully", "how to ride a bicycle", "the history of mobile phones", "a wedding in the village"]],
    ],
  },
];

export function buildLanguage(rng) {
  const out = [];
  P.forEach((p, pi) => {
    p.qs.forEach(([type, question, opts], qi) => {
      const { options, correct } = arrange(rng, opts[0], opts.slice(1));
      const key = `lan:${pi}:${qi}`;
      out.push({
        id: uuidFrom(key),
        key,
        passage: pi,
        subject: "language",
        topic: LANG_TOPICS[type],
        difficulty: type === "infer" || type === "main" ? "medium" : type === "grammar" ? "hard" : "easy",
        text: `Read the passage carefully and answer the question.\n\n"${p.title}"\n${p.text}\n\nQuestion: ${question}`,
        options,
        correct,
        explanation: `The answer is "${opts[0]}". Read the passage again and find the line that supports it.`,
      });
    });
  });
  return out;
}
export const PASSAGE_COUNT = P.length;
