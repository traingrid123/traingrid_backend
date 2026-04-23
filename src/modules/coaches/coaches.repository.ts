import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

export const coachProfileArgs = Prisma.validator<Prisma.CoachDefaultArgs>()({
  include: {
    certifications: {
      orderBy: {
        createdAt: "desc"
      }
    },
    marketingProfile: {
      include: {
        pricingTiers: {
          where: {
            isActive: true
          },
          orderBy: [
            {
              isPopular: "desc"
            },
            {
              createdAt: "asc"
            }
          ]
        },
        testimonials: {
          where: {
            isApproved: true
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 6
        }
      }
    },
    analytics: true
  }
});

const coachProfileInclude = coachProfileArgs.include;

const relationshipInclude = {
  certifications: {
    orderBy: {
      createdAt: "desc" as const
    }
  },
  client: {
    select: {
      id: true,
      fullName: true,
      profilePhoto: true,
      fitnessGoal: true,
      currentWeight: true,
      goalWeight: true,
      updatedAt: true,
      createdAt: true,
      city: true,
      country: true
    }
  },
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
} as const;

function buildDiscoverWhere(params: {
  search?: string;
  specialisation?: string;
  coachingMode?: string;
  verifiedOnly?: boolean;
}): Prisma.CoachWhereInput {
  const where: Prisma.CoachWhereInput = {
    isActive: true
  };

  if (params.verifiedOnly) {
    where.isVerified = true;
  }

  if (params.coachingMode) {
    where.coachingMode = params.coachingMode as any;
  }

  if (params.specialisation) {
    where.specialisations = {
      has: params.specialisation
    };
  }

  if (params.search) {
    where.OR = [
      {
        fullName: {
          contains: params.search,
          mode: "insensitive"
        }
      },
      {
        bio: {
          contains: params.search,
          mode: "insensitive"
        }
      },
      {
        specialisations: {
          has: params.search
        }
      },
      {
        city: {
          contains: params.search,
          mode: "insensitive"
        }
      },
      {
        country: {
          contains: params.search,
          mode: "insensitive"
        }
      }
    ];
  }

  return where;
}

export const coachesRepository = {
  findById(coachId: string) {
    return prisma.coach.findUnique({
      where: {
        id: coachId
      },
      include: coachProfileInclude
    });
  },

  discover(params: {
    page: number;
    limit: number;
    search?: string;
    specialisation?: string;
    coachingMode?: string;
    verifiedOnly?: boolean;
  }) {
    const where = buildDiscoverWhere(params);
    const skip = (params.page - 1) * params.limit;

    return prisma.coach.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: [
        {
          isVerified: "desc"
        },
        {
          peopleTrainedCount: "desc"
        },
        {
          updatedAt: "desc"
        }
      ],
      include: {
        certifications: {
          where: {
            isVerified: true
          },
          take: 1
        },
        marketingProfile: {
          include: {
            testimonials: {
              where: {
                isApproved: true,
                rating: {
                  not: null
                }
              },
              select: {
                rating: true
              }
            }
          }
        }
      }
    });
  },

  countDiscover(params: {
    search?: string;
    specialisation?: string;
    coachingMode?: string;
    verifiedOnly?: boolean;
  }) {
    return prisma.coach.count({
      where: buildDiscoverWhere(params)
    });
  },

  listRelationships(coachId: string, params: {
    page: number;
    limit: number;
    status?: string;
    goal?: string;
    search?: string;
    risk?: string;
    planType?: "workout" | "nutrition" | "combined";
  }) {
    const skip = (params.page - 1) * params.limit;

    return prisma.coachClientRelationship.findMany({
      where: {
        coachId,
        ...(params.status ? { status: params.status as any } : {}),
        ...(params.risk ? { dropOffRisk: params.risk as any } : {}),
        ...(params.goal
          ? {
              client: {
                fitnessGoal: {
                  contains: params.goal,
                  mode: "insensitive"
                }
              }
            }
          : {}),
        ...(params.search
          ? {
              OR: [
                {
                  client: {
                    fullName: {
                      contains: params.search,
                      mode: "insensitive"
                    }
                  }
                },
                {
                  client: {
                    fitnessGoal: {
                      contains: params.search,
                      mode: "insensitive"
                    }
                  }
                }
              ]
            }
          : {}),
        ...(params.planType === "workout"
          ? {
              workoutPlanId: {
                not: null
              }
            }
          : {}),
        ...(params.planType === "nutrition"
          ? {
              nutritionPlanId: {
                not: null
              }
            }
          : {}),
        ...(params.planType === "combined"
          ? {
              workoutPlanId: {
                not: null
              },
              nutritionPlanId: {
                not: null
              }
            }
          : {})
      },
      skip,
      take: params.limit,
      orderBy: [
        {
          updatedAt: "desc"
        },
        {
          createdAt: "desc"
        }
      ],
      include: relationshipInclude
    });
  },

  countRelationships(coachId: string, params: {
    status?: string;
    goal?: string;
    search?: string;
    risk?: string;
    planType?: "workout" | "nutrition" | "combined";
  }) {
    return prisma.coachClientRelationship.count({
      where: {
        coachId,
        ...(params.status ? { status: params.status as any } : {}),
        ...(params.risk ? { dropOffRisk: params.risk as any } : {}),
        ...(params.goal
          ? {
              client: {
                fitnessGoal: {
                  contains: params.goal,
                  mode: "insensitive"
                }
              }
            }
          : {}),
        ...(params.search
          ? {
              OR: [
                {
                  client: {
                    fullName: {
                      contains: params.search,
                      mode: "insensitive"
                    }
                  }
                },
                {
                  client: {
                    fitnessGoal: {
                      contains: params.search,
                      mode: "insensitive"
                    }
                  }
                }
              ]
            }
          : {}),
        ...(params.planType === "workout"
          ? {
              workoutPlanId: {
                not: null
              }
            }
          : {}),
        ...(params.planType === "nutrition"
          ? {
              nutritionPlanId: {
                not: null
              }
            }
          : {}),
        ...(params.planType === "combined"
          ? {
              workoutPlanId: {
                not: null
              },
              nutritionPlanId: {
                not: null
              }
            }
          : {})
      }
    });
  },

  findRelationship(coachId: string, clientId: string) {
    return prisma.coachClientRelationship.findUnique({
      where: {
        coachId_clientId: {
          coachId,
          clientId
        }
      },
      include: {
        ...relationshipInclude,
        client: {
          select: {
            id: true,
            fullName: true,
            profilePhoto: true,
            fitnessGoal: true,
            currentWeight: true,
            goalWeight: true,
            startingWeight: true,
            city: true,
            country: true,
            createdAt: true,
            updatedAt: true,
            workoutLogs: {
              orderBy: {
                loggedAt: "desc"
              },
              take: 30,
              select: {
                id: true,
                loggedAt: true,
                isCompleted: true,
                workoutDay: {
                  select: {
                    title: true
                  }
                }
              }
            },
            nutritionLogs: {
              orderBy: {
                loggedAt: "desc"
              },
              take: 30,
              select: {
                id: true,
                loggedAt: true,
                isCompleted: true
              }
            },
            habitLogs: {
              orderBy: {
                loggedAt: "desc"
              },
              take: 30,
              select: {
                id: true,
                loggedAt: true,
                isCompleted: true,
                habit: {
                  select: {
                    name: true
                  }
                }
              }
            },
            progressEntries: {
              orderBy: {
                recordedAt: "desc"
              },
              take: 12,
              select: {
                id: true,
                recordedAt: true,
                weightKg: true,
                photoUrl: true
              }
            },
            notifications: {
              orderBy: {
                createdAt: "desc"
              },
              take: 10,
              select: {
                id: true,
                type: true,
                title: true,
                body: true,
                isRead: true,
                createdAt: true
              }
            }
          }
        }
      }
    });
  },

  listNotifications(coachId: string, limit = 10) {
    return prisma.notification.findMany({
      where: {
        coachId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });
  },

  listPendingPayments(coachId: string, limit = 10) {
    return prisma.coachClientRelationship.findMany({
      where: {
        coachId,
        nextPaymentDue: {
          not: null
        }
      },
      orderBy: {
        nextPaymentDue: "asc"
      },
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            profilePhoto: true
          }
        }
      }
    });
  },

  listRecentRelationships(coachId: string, limit = 5) {
    return prisma.coachClientRelationship.findMany({
      where: {
        coachId
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: limit,
      include: relationshipInclude
    });
  }
};
