import { db } from "./index";
import { managements, jobs } from "./schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Seed managements table
    await seedManagements();
    // Seed jobs table
    await seedJobs();

    console.log("✅ Database seeding completed successfully");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

async function seedManagements() {
  const managementData = [
    { name: "Frontier CFO", email: "ttt.studios@frontiercfo.ca" },
    { name: "Liam McLean", email: "liam.mclean@ttt.studio" },
    { name: "Jose Hernandez", email: "jose@ttt.studio" },
    { name: "Irving Waisman", email: "irving.waisman@ttt.studio" },
    { name: "David Hobbs", email: "david@ttt.studio" },
  ];

  console.log("📝 Seeding managements table...");

  for (const mgmt of managementData) {
    const existing = db
      .select()
      .from(managements)
      .where(eq(managements.email, mgmt.email))
      .get();

    if (!existing) {
      db.insert(managements).values(mgmt).run();
      console.log(`  ✓ Added management: ${mgmt.name} (${mgmt.email})`);
    } else {
      console.log(`  ⊘ Management already exists: ${mgmt.name}`);
    }
  }
}

async function seedJobs() {
  const jobsData = [
    {
      name: "timesheet-check",
      schedule: "0 */1 9-17 * * 1,2",
      description:
        "Checks timesheet submissions every hour on weekdays 9-5 (format: second minute hour day month weekday)",
      active: true,
    },
  ];

  console.log("📝 Seeding jobs table...");

  for (const job of jobsData) {
    const existing = db
      .select()
      .from(jobs)
      .where(eq(jobs.name, job.name))
      .get();

    if (!existing) {
      db.insert(jobs)
        .values({
          name: job.name,
          schedule: job.schedule,
          description: job.description,
          active: job.active,
        })
        .run();
      console.log(`  ✓ Added job: ${job.name}`);
    } else {
      console.log(`  ⊘ Job already exists: ${job.name}`);
    }
  }
}
