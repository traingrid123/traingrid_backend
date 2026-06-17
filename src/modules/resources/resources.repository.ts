import { prisma } from "../../lib/prisma";
import { CreateResourceInput, UpdateResourceInput } from "./resources.schema";

const resourceInclude = {
  access: {
    include: {
      client: { select: { id: true, fullName: true, profilePhoto: true } }
    }
  }
} as const;

export const resourcesRepository = {
  async create(coachId: string, data: CreateResourceInput) {
    return prisma.resource.create({
      data: { coachId, ...data },
      include: resourceInclude
    });
  },

  async listCoachResources(coachId: string) {
    return prisma.resource.findMany({
      where: { coachId },
      include: resourceInclude,
      orderBy: { createdAt: "desc" }
    });
  },

  async findById(resourceId: string) {
    return prisma.resource.findUnique({
      where: { id: resourceId },
      include: resourceInclude
    });
  },

  async update(resourceId: string, data: UpdateResourceInput) {
    return prisma.resource.update({
      where: { id: resourceId },
      data,
      include: resourceInclude
    });
  },

  async delete(resourceId: string) {
    return prisma.resource.delete({ where: { id: resourceId } });
  },

  async grantAccess(resourceId: string, clientId: string) {
    return prisma.resourceAccess.upsert({
      where: { resourceId_clientId: { resourceId, clientId } },
      create: { resourceId, clientId },
      update: {}
    });
  },

  async revokeAccess(resourceId: string, clientId: string) {
    return prisma.resourceAccess.deleteMany({
      where: { resourceId, clientId }
    });
  },

  async listClientResources(clientId: string) {
    const access = await prisma.resourceAccess.findMany({
      where: { clientId },
      include: {
        resource: {
          include: {
            coach: { select: { id: true, fullName: true, profilePhoto: true } }
          }
        }
      },
      orderBy: { grantedAt: "desc" }
    });
    return access.map((a) => ({ ...a.resource, grantedAt: a.grantedAt }));
  }
};
