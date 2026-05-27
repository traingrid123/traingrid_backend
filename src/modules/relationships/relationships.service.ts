import { ClientStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export class RelationshipsError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "RelationshipsError";
  }
}

export const relationshipsService = {
  createRelationship: async (coachId: string, clientId: string, data: any = {}) => {
    const existing = await prisma.coachClientRelationship.findUnique({
      where: {
        coachId_clientId: { coachId, clientId }
      }
    });

    if (existing) {
      throw new RelationshipsError("Relationship already exists", 400);
    }

    return prisma.coachClientRelationship.create({
      data: {
        coachId,
        clientId,
        status: "ACTIVE" as ClientStatus,
        startDate: new Date(),
        monthlyFee: data.monthlyFee,
        notes: data.notes
      },
      include: {
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  },

  getCoachClients: async (coachId: string) => {
    return prisma.coachClientRelationship.findMany({
      where: { coachId },
      include: {
        client: true,
        workoutPlan: {
          select: {
            id: true,
            title: true
          }
        },
        nutritionPlan: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  },

  getClientCoaches: async (clientId: string) => {
    return prisma.coachClientRelationship.findMany({
      where: { clientId },
      include: {
        coach: true
      },
      orderBy: { createdAt: "desc" }
    });
  },

  getRelationship: async (coachId: string, clientId: string) => {
    const relationship = await prisma.coachClientRelationship.findUnique({
      where: {
        coachId_clientId: { coachId, clientId }
      },
      include: {
        coach: true,
        client: true,
        workoutPlan: true,
        nutritionPlan: true
      }
    });

    if (!relationship) {
      throw new RelationshipsError("Relationship not found", 404);
    }

    return relationship;
  },

  updateRelationship: async (coachId: string, clientId: string, data: any) => {
    const relationship = await prisma.coachClientRelationship.findUnique({
      where: {
        coachId_clientId: { coachId, clientId }
      }
    });

    if (!relationship) {
      throw new RelationshipsError("Relationship not found", 404);
    }

    return prisma.coachClientRelationship.update({
      where: {
        coachId_clientId: { coachId, clientId }
      },
      data,
      include: {
        coach: true,
        client: true
      }
    });
  },

  endRelationship: async (coachId: string, clientId: string) => {
    return prisma.coachClientRelationship.update({
      where: {
        coachId_clientId: { coachId, clientId }
      },
      data: {
        status: "INACTIVE" as ClientStatus,
        endDate: new Date()
      }
    });
  },

  assignWorkoutPlan: async (coachId: string, clientId: string, workoutPlanId: string) => {
    return prisma.coachClientRelationship.update({
      where: {
        coachId_clientId: { coachId, clientId }
      },
      data: {
        workoutPlanId
      }
    });
  },

  assignNutritionPlan: async (coachId: string, clientId: string, nutritionPlanId: string) => {
    return prisma.coachClientRelationship.update({
      where: {
        coachId_clientId: { coachId, clientId }
      },
      data: {
        nutritionPlanId
      }
    });
  }
};
