import { prisma } from "../../lib/prisma";

export const relationshipsRepository = {
  getCoachClients: (coachId: string) =>
    prisma.coachClientRelationship.findMany({
      where: { coachId },
      include: {
        client: true,
        workoutPlan: true,
        nutritionPlan: true
      }
    }),

  getClientCoaches: (clientId: string) =>
    prisma.coachClientRelationship.findMany({
      where: { clientId },
      include: {
        coach: true
      }
    }),

  getRelationship: (coachId: string, clientId: string) =>
    prisma.coachClientRelationship.findUnique({
      where: {
        coachId_clientId: { coachId, clientId }
      },
      include: {
        coach: true,
        client: true,
        workoutPlan: true,
        nutritionPlan: true
      }
    }),

  createRelationship: (coachId: string, clientId: string, data: any) =>
    prisma.coachClientRelationship.create({
      data: {
        coachId,
        clientId,
        status: "ACTIVE",
        startDate: new Date(),
        ...data
      }
    }),

  updateRelationship: (coachId: string, clientId: string, data: any) =>
    prisma.coachClientRelationship.update({
      where: {
        coachId_clientId: { coachId, clientId }
      },
      data
    }),

  deleteRelationship: (coachId: string, clientId: string) =>
    prisma.coachClientRelationship.delete({
      where: {
        coachId_clientId: { coachId, clientId }
      }
    })
};
