import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main(): Promise<void> {
    console.log("🌱 Starting database seed...");

    // Create test coaches
    const hashedPassword = await bcrypt.hash("password123", 12);

    const coach1 = await prisma.coach.upsert({
        where: { email: "coach1@test.com" },
        update: {},
        create: {
            email: "coach1@test.com",
            firstName: "John",
            lastName: "Doe",
            password: hashedPassword,
            specialization: "Strength Training",
            bio: "Expert in strength and conditioning",
            experience: 10,
            coachingMode: "ONLINE",
            tier: "PREMIUM",
            baseRate: 50,
            profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=coach1"
        }
    });

    const coach2 = await prisma.coach.upsert({
        where: { email: "coach2@test.com" },
        update: {},
        create: {
            email: "coach2@test.com",
            firstName: "Jane",
            lastName: "Smith",
            password: hashedPassword,
            specialization: "Weight Loss",
            bio: "Certified nutritionist and fitness coach",
            experience: 8,
            coachingMode: "HYBRID",
            tier: "STANDARD",
            baseRate: 35,
            profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=coach2"
        }
    });

    // Create test clients
    const client1 = await prisma.client.upsert({
        where: { email: "client1@test.com" },
        update: {},
        create: {
            email: "client1@test.com",
            firstName: "Alice",
            lastName: "Johnson",
            password: hashedPassword,
            gender: "FEMALE",
            age: 28,
            fitnessLevel: "BEGINNER",
            goals: "Build muscle and improve strength",
            profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=client1"
        }
    });

    const client2 = await prisma.client.upsert({
        where: { email: "client2@test.com" },
        update: {},
        create: {
            email: "client2@test.com",
            firstName: "Bob",
            lastName: "Wilson",
            password: hashedPassword,
            gender: "MALE",
            age: 35,
            fitnessLevel: "INTERMEDIATE",
            goals: "Lose weight and improve cardio",
            profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=client2"
        }
    });

    // Create coach analytics
    await prisma.coachAnalytics.upsert({
        where: { coachId: coach1.id },
        update: {},
        create: {
            coachId: coach1.id,
            totalClients: 5,
            activeClients: 4,
            weeklyActiveClients: 3,
            avgComplianceRate: 85.5,
            totalRevenue: 2500,
            monthlyRevenue: 500,
            profileViews: 125,
            totalLeads: 20,
            conversionRate: 25,
            planCompletionRate: 80
        }
    });

    // Create relationships
    const rel1 = await prisma.coachClientRelationship.upsert({
        where: {
            coachId_clientId: { coachId: coach1.id, clientId: client1.id }
        },
        update: {},
        create: {
            coachId: coach1.id,
            clientId: client1.id,
            status: "ACTIVE",
            startDate: new Date("2024-01-01"),
            monthlyFee: 99.99,
            dropOffRisk: "LOW",
            notes: "First time client, very motivated"
        }
    });

    const rel2 = await prisma.coachClientRelationship.upsert({
        where: {
            coachId_clientId: { coachId: coach2.id, clientId: client2.id }
        },
        update: {},
        create: {
            coachId: coach2.id,
            clientId: client2.id,
            status: "ACTIVE",
            startDate: new Date("2024-02-15"),
            monthlyFee: 79.99,
            dropOffRisk: "MEDIUM",
            notes: "Client needs accountability"
        }
    });

    // Create workout plan
    const workoutPlan = await prisma.workoutPlan.upsert({
        where: { title_coachId: { title: "Beginner Strength Plan", coachId: coach1.id } },
        update: {},
        create: {
            coachId: coach1.id,
            title: "Beginner Strength Plan",
            description: "A 4-week beginner strength training program",
            level: "BEGINNER",
            durationWeeks: 4,
            coachClientRelationships: {
                connect: { coachId_clientId: { coachId: coach1.id, clientId: client1.id } }
            }
        }
    });

    // Create exercises
    const exercise1 = await prisma.exercise.upsert({
        where: { name_equipment: { name: "Barbell Squat", equipment: "BARBELL" } },
        update: {},
        create: {
            name: "Barbell Squat",
            description: "Full body compound movement",
            equipment: "BARBELL",
            muscleGroups: ["QUADRICEPS", "GLUTES", "HAMSTRINGS"],
            difficulty: "INTERMEDIATE",
            videoUrl: "https://example.com/squat.mp4"
        }
    });

    const exercise2 = await prisma.exercise.upsert({
        where: { name_equipment: { name: "Bench Press", equipment: "BARBELL" } },
        update: {},
        create: {
            name: "Bench Press",
            description: "Upper body pushing movement",
            equipment: "BARBELL",
            muscleGroups: ["CHEST", "TRICEPS", "SHOULDERS"],
            difficulty: "INTERMEDIATE",
            videoUrl: "https://example.com/benchpress.mp4"
        }
    });

    // Create workout days
    const workoutDay1 = await prisma.workoutDay.upsert({
        where: {
            workoutPlanId_dayOfWeek: { workoutPlanId: workoutPlan.id, dayOfWeek: "MONDAY" }
        },
        update: {},
        create: {
            workoutPlanId: workoutPlan.id,
            dayOfWeek: "MONDAY",
            focusArea: "LEGS",
            description: "Leg day with focus on squats",
            exercises: {
                create: [
                    {
                        exerciseId: exercise1.id,
                        sets: 4,
                        reps: 8,
                        rest: 120,
                        order: 1
                    }
                ]
            }
        }
    });

    // Create nutrition plan
    const nutritionPlan = await prisma.nutritionPlan.upsert({
        where: { title_coachId: { title: "High Protein Diet", coachId: coach2.id } },
        update: {},
        create: {
            coachId: coach2.id,
            title: "High Protein Diet",
            description: "High protein diet for muscle building",
            level: "BEGINNER",
            mealSections: {
                create: [
                    { name: "Breakfast", order: 1 },
                    { name: "Lunch", order: 2 },
                    { name: "Dinner", order: 3 }
                ]
            },
            coachClientRelationships: {
                connect: { coachId_clientId: { coachId: coach2.id, clientId: client2.id } }
            }
        }
    });

    // Create habits
    const habit1 = await prisma.habit.create({
        data: {
            clientId: client1.id,
            name: "Drink 8 glasses of water",
            description: "Stay hydrated throughout the day",
            frequency: "DAILY",
            targetDaysPerWeek: 7,
            createdAt: new Date()
        }
    });

    const habit2 = await prisma.habit.create({
        data: {
            clientId: client2.id,
            name: "Morning run",
            description: "30 minute morning run",
            frequency: "DAILY",
            targetDaysPerWeek: 5,
            createdAt: new Date()
        }
    });

    // Create habit logs
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        await prisma.habitLog.create({
            data: {
                habitId: habit1.id,
                completed: Math.random() > 0.3,
                notes: i % 2 === 0 ? "Completed all glasses" : undefined,
                createdAt: date
            }
        });

        await prisma.habitLog.create({
            data: {
                habitId: habit2.id,
                completed: Math.random() > 0.4,
                notes: i % 3 === 0 ? "Great run!" : undefined,
                createdAt: date
            }
        });
    }

    console.log("✅ Database seeded successfully!");
    console.log("\n📊 Created data:");
    console.log("  - 2 Coaches");
    console.log("  - 2 Clients");
    console.log("  - 2 Relationships");
    console.log("  - 1 Workout Plan");
    console.log("  - 2 Exercises");
    console.log("  - 1 Nutrition Plan");
    console.log("  - 2 Habits");
    console.log("  - 14 Habit Logs");
    console.log("\n🔐 Test Credentials:");
    console.log("  Coach 1: coach1@test.com / password123");
    console.log("  Coach 2: coach2@test.com / password123");
    console.log("  Client 1: client1@test.com / password123");
    console.log("  Client 2: client2@test.com / password123");
}

main().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
});
