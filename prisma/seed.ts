import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type TagSeed = {
  name: string;
  slug: string;
  children?: { name: string; slug: string }[];
};

const hierarchicalTags: TagSeed[] = [
  {
    name: "Figürler",
    slug: "figures",
    children: [
      { name: "Anime", slug: "anime" },
      { name: "Oyun", slug: "games" },
      { name: "Scale", slug: "scale" },
      { name: "Garage Kit", slug: "garage-kits" },
    ],
  },
  {
    name: "El Yapımı",
    slug: "handcrafts",
    children: [
      { name: "Anahtarlıklar", slug: "keychains" },
      { name: "Aksesuarlar", slug: "accessories" },
      { name: "Peluşlar", slug: "plush" },
    ],
  },
  {
    name: "Sanat Baskıları",
    slug: "art-prints",
    children: [
      { name: "Posterler", slug: "posters" },
      { name: "Çerçeveli", slug: "framed" },
      { name: "Kartpostallar", slug: "postcards" },
    ],
  },
  {
    name: "Çıkartmalar",
    slug: "stickers",
    children: [
      { name: "Şekilli Kesim", slug: "die-cut" },
      { name: "Sayfalar", slug: "sheets" },
    ],
  },
];

const flatTags = [
  { name: "Çok Satanlar", slug: "best-seller" },
  { name: "Sınırlı Üretim", slug: "limited-edition" },
  { name: "Çeşitli", slug: "misc" },
];

async function seedTags() {
  for (const [parentIndex, parent] of hierarchicalTags.entries()) {
    const parentTag = await prisma.tag.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name, sortOrder: parentIndex },
      create: {
        name: parent.name,
        slug: parent.slug,
        type: "HIERARCHICAL",
        sortOrder: parentIndex,
      },
    });
    for (const [childIndex, child] of (parent.children ?? []).entries()) {
      await prisma.tag.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          parentId: parentTag.id,
          sortOrder: childIndex,
        },
        create: {
          name: child.name,
          slug: child.slug,
          type: "HIERARCHICAL",
          parentId: parentTag.id,
          sortOrder: childIndex,
        },
      });
    }
  }
  for (const [index, tag] of flatTags.entries()) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name, sortOrder: index },
      create: {
        name: tag.name,
        slug: tag.slug,
        type: "FLAT",
        sortOrder: index,
      },
    });
  }
}

async function tagId(slug: string) {
  const tag = await prisma.tag.findUniqueOrThrow({ where: { slug } });
  return tag.id;
}

// PRD Appendix A: two option types => four variants, each with own price/stock.
async function seedAngelStatue() {
  await prisma.product.deleteMany({ where: { slug: "angel-statue" } });

  const product = await prisma.product.create({
    data: {
      name: "Angel Statue",
      slug: "angel-statue",
      description:
        "El yapımı melek heykeli. Boyalı veya boyasız yüzey seçeneği ve iki farklı boyut ile. Her parça atölyemizde tek tek dökülür ve elde rötuşlanır.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      isFeatured: true,
      tags: {
        create: [{ tagId: await tagId("scale") }, { tagId: await tagId("garage-kits") }],
      },
      images: {
        create: [
          {
            key: "seed/angel-statue-1.jpg",
            alt: "Angel Statue melek heykeli, önden görünüm",
            sortOrder: 0,
            isPrimary: true,
          },
          {
            key: "seed/angel-statue-2.jpg",
            alt: "Angel Statue melek heykeli, detay görünüm",
            sortOrder: 1,
          },
        ],
      },
      optionTypes: {
        create: [
          {
            name: "Yüzey",
            sortOrder: 0,
            values: {
              create: [
                { value: "Boyalı", sortOrder: 0 },
                { value: "Boyasız", sortOrder: 1 },
              ],
            },
          },
          {
            name: "Boyut",
            sortOrder: 1,
            values: {
              create: [
                { value: "20cm", sortOrder: 0 },
                { value: "40cm", sortOrder: 1 },
              ],
            },
          },
        ],
      },
    },
    include: { optionTypes: { include: { values: true } } },
  });

  const valueId = (typeName: string, value: string) => {
    const type = product.optionTypes.find((t) => t.name === typeName);
    const match = type?.values.find((v) => v.value === value);
    if (!match) throw new Error(`Missing option value ${typeName}/${value}`);
    return match.id;
  };

  const variants: {
    sku: string;
    finish: string;
    size: string;
    priceCents: number;
    stock: number;
  }[] = [
    { sku: "ANGEL-P-20", finish: "Boyalı", size: "20cm", priceCents: 4500, stock: 3 },
    { sku: "ANGEL-P-40", finish: "Boyalı", size: "40cm", priceCents: 8900, stock: 1 },
    { sku: "ANGEL-U-20", finish: "Boyasız", size: "20cm", priceCents: 2900, stock: 5 },
    { sku: "ANGEL-U-40", finish: "Boyasız", size: "40cm", priceCents: 5900, stock: 0 },
  ];

  for (const v of variants) {
    await prisma.variant.create({
      data: {
        productId: product.id,
        sku: v.sku,
        priceCents: v.priceCents,
        stock: v.stock,
        optionValues: {
          create: [
            { optionValueId: valueId("Yüzey", v.finish) },
            { optionValueId: valueId("Boyut", v.size) },
          ],
        },
      },
    });
  }
}

// PRD Appendix B: no options => exactly one default variant.
async function seedMikuNendoroid() {
  await prisma.product.deleteMany({ where: { slug: "miku-nendoroid" } });

  await prisma.product.create({
    data: {
      name: "Miku Nendoroid",
      slug: "miku-nendoroid",
      description:
        "Sevilen vokaloid karakterinin sevimli nendoroid figürü. Değiştirilebilir yüz ifadeleri ve aksesuarları ile birlikte, orijinal kutusunda gönderilir.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      tags: {
        create: [{ tagId: await tagId("anime") }, { tagId: await tagId("best-seller") }],
      },
      images: {
        create: [
          {
            key: "seed/miku-nendoroid-1.jpg",
            alt: "Miku Nendoroid figürü, kutusuyla birlikte",
            sortOrder: 0,
            isPrimary: true,
          },
        ],
      },
      variants: {
        create: [{ sku: "MIKU-NEND", priceCents: 129900, stock: 10 }],
      },
    },
  });
}

// PRD Appendix A example sale; step 4 resolves parent tags to children.
async function seedSale() {
  await prisma.sale.deleteMany({ where: { name: "Figürlerde %15 İndirim" } });

  const now = Date.now();
  await prisma.sale.create({
    data: {
      name: "Figürlerde %15 İndirim",
      type: "PERCENT",
      value: 15,
      startsAt: new Date(now - 24 * 60 * 60 * 1000),
      endsAt: new Date(now + 14 * 24 * 60 * 60 * 1000),
      tags: { create: [{ tagId: await tagId("figures") }] },
    },
  });
}

async function seedSettings() {
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      flatShippingCents: 15000,
      freeShippingThresholdCents: 150000,
      lowStockThreshold: 3,
    },
  });
}

async function main() {
  await seedTags();
  await seedAngelStatue();
  await seedMikuNendoroid();
  await seedSale();
  await seedSettings();
  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
