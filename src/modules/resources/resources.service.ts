import { resourcesRepository } from "./resources.repository";
import { CreateResourceInput, GrantAccessInput, UpdateResourceInput } from "./resources.schema";

export class ResourceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ResourceError";
  }
}

export const resourcesService = {
  async createResource(coachId: string, requesterId: string, data: CreateResourceInput) {
    if (requesterId !== coachId) {
      throw new ResourceError("Forbidden", 403);
    }
    return resourcesRepository.create(coachId, data);
  },

  async listCoachResources(coachId: string, requesterId: string) {
    if (requesterId !== coachId) {
      throw new ResourceError("Forbidden", 403);
    }
    return resourcesRepository.listCoachResources(coachId);
  },

  async updateResource(requesterId: string, resourceId: string, data: UpdateResourceInput) {
    const resource = await resourcesRepository.findById(resourceId);
    if (!resource) {
      throw new ResourceError("Resource not found", 404);
    }
    if (resource.coachId !== requesterId) {
      throw new ResourceError("Forbidden", 403);
    }
    return resourcesRepository.update(resourceId, data);
  },

  async deleteResource(requesterId: string, resourceId: string) {
    const resource = await resourcesRepository.findById(resourceId);
    if (!resource) {
      throw new ResourceError("Resource not found", 404);
    }
    if (resource.coachId !== requesterId) {
      throw new ResourceError("Forbidden", 403);
    }
    return resourcesRepository.delete(resourceId);
  },

  async grantAccess(requesterId: string, resourceId: string, data: GrantAccessInput) {
    const resource = await resourcesRepository.findById(resourceId);
    if (!resource) {
      throw new ResourceError("Resource not found", 404);
    }
    if (resource.coachId !== requesterId) {
      throw new ResourceError("Forbidden", 403);
    }
    const results = await Promise.all(
      data.clientIds.map((clientId) => resourcesRepository.grantAccess(resourceId, clientId))
    );
    return results;
  },

  async revokeAccess(requesterId: string, resourceId: string, clientId: string) {
    const resource = await resourcesRepository.findById(resourceId);
    if (!resource) {
      throw new ResourceError("Resource not found", 404);
    }
    if (resource.coachId !== requesterId) {
      throw new ResourceError("Forbidden", 403);
    }
    return resourcesRepository.revokeAccess(resourceId, clientId);
  },

  async listClientResources(clientId: string, requesterId: string) {
    if (requesterId !== clientId) {
      throw new ResourceError("Forbidden", 403);
    }
    return resourcesRepository.listClientResources(clientId);
  }
};
