import { prisma } from "../../lib/prisma";

export const clientsRepository = {
  findById(clientId: string) {
    return prisma.client.findUnique({
      where: {
        id: clientId
      },
      include: {
        relationships: {
          orderBy: {
            updatedAt: "desc"
          },
          include: {
            coach: {
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
            },
            workoutPlan: {
              include: {
                workoutDays: {
                  orderBy: [
                    {
                      weekNumber: "asc"
                    },
                    {
                      orderIndex: "asc"
                    }
                  ],
                  include: {
                    workoutDayExercises: {
                      orderBy: {
                        orderIndex: "asc"
                      },
                      include: {
                        exercise: true
                      }
                    }
                  }
                }
              }
            },
            nutritionPlan: {
              include: {
                mealSections: {
                  orderBy: [
                    {
                      weekNumber: "asc"
                    },
                    {
                      dayNumber: "asc"
                    },
                    {
                      orderIndex: "asc"
                    }
                  ],
                  include: {
                    mealFoods: {
                      orderBy: {
                        orderIndex: "asc"
                      },
                      include: {
                        foodItem: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        habits: {
          where: {
            isActive: true
          },
          orderBy: {
            createdAt: "asc"
          }
        },
        habitLogs: {
          orderBy: {
            loggedAt: "desc"
          },
          take: 30,
          include: {
            habit: true
          }
        },
        workoutLogs: {
          orderBy: {
            loggedAt: "desc"
          },
          take: 30,
          include: {
            workoutDay: {
              include: {
                workoutDayExercises: {
                  orderBy: {
                    orderIndex: "asc"
                  },
                  include: {
                    exercise: true
                  }
                }
              }
            }
          }
        },
        nutritionLogs: {
          orderBy: {
            loggedAt: "desc"
          },
          take: 30,
          include: {
            mealSection: true
          }
        },
        progressEntries: {
          orderBy: {
            recordedAt: "desc"
          },
          take: 12
        },
        notifications: {
          orderBy: {
            createdAt: "desc"
          },
          take: 10
        }
      }
    });
  }
};
