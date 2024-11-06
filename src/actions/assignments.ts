import { defineAction, ActionError } from "astro:actions";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import {
  getEnrolledCourses,
  getEnrolledCoursesById,
  getEnrolledCoursesByUsername,
  getMentorCourses,
} from "./courses";
import { z } from "zod";

export const getAllAssignedAssignments = defineAction({
  handler: async (_, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser?.username) {
        throw new Error("Unauthorized");
      }

      return await db.course.findMany({
        where: {
          enrolledUsers: {
            some: {
              username: currentUser.username,
            },
          },
        },
        select: {
          id: true,
          classes: {
            select: {
              attachments: {
                where: {
                  attachmentType: "ASSIGNMENT",
                },
                include: {
                  class: true,
                  submissions: {
                    where: {
                      enrolledUser: {
                        username: currentUser.username,
                      },
                    },
                    include: {
                      points: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    } catch (error) {
      return new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }
});

export const getAllAssignedAssignmentsByUserId = defineAction({
  handler: async (_, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser?.username) {
        throw new Error("Unauthorized");
      }

      const { data: courses } = await getEnrolledCoursesByUsername({ username: currentUser.username });

      const coursesWithAssignments = await db.course.findMany({
        where: {
          enrolledUsers: {
            some: {
              user: {
                username: currentUser.username,
              },
            },
          },
        },
        select: {
          id: true,
          classes: {
            select: {
              attachments: {
                where: {
                  attachmentType: "ASSIGNMENT",
                },
                include: {
                  class: true,
                  submissions: {
                    where: {
                      enrolledUser: {
                        user: {
                          username: currentUser.username,
                        },
                      },
                    },
                    include: {
                      points: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      return {
        courses: courses || [],
        coursesWithAssignments: coursesWithAssignments || [],
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getAllAssignmentsForMentor = defineAction({
  handler: async (_, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) throw new Error("Unauthorized");

      const courses = await getMentorCourses();

      const coursesWithAssignments = await db.course.findMany({
        where: {
          enrolledUsers: {
            some: {
              mentorUsername: currentUser.username,
            },
          },
        },
        select: {
          id: true,
          classes: {
            select: {
              attachments: {
                where: {
                  attachmentType: "ASSIGNMENT",
                  submissions: {
                    some: {
                      enrolledUser: {
                        mentorUsername: currentUser.username,
                      },
                    },
                  },
                },
                include: {
                  class: true,
                  submissions: {
                    where: {
                      enrolledUser: {
                        mentorUsername: currentUser.username,
                      },
                    },
                    include: {
                      points: true,
                    },
                  },
                },
              },
              createdAt: true,
            },
          },
        },
      });

      return { courses, coursesWithAssignments };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getAllAssignmentsForInstructor = defineAction({
  handler: async (_, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) throw new Error("Unauthorized");

      const { data: courses } = await getEnrolledCourses();

      const coursesWithAssignments = await db.course.findMany({
        where: {
          id: {
            in: courses?.data?.map((course) => course.id) ?? [],
          },
        },
        select: {
          id: true,
          classes: {
            select: {
              attachments: {
                where: {
                  attachmentType: "ASSIGNMENT",
                },
                include: {
                  class: true,
                  submissions: {
                    include: {
                      points: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      return { courses, coursesWithAssignments };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getAllAssignments = defineAction({
  handler: async (_, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser?.username) {
        throw new Error("Unauthorized");
      }

      const { data: courses } = await getEnrolledCourses();

      return await db.attachment.findMany({
        where: {
          attachmentType: "ASSIGNMENT",
          courseId: {
            in: courses?.data?.map((course) => course.id) ?? [],
          },
        },
        include: {
          course: true,
        },
        orderBy: {
          createdAt: "desc"
        },
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getAllAssignedAssignmentsForMentor = defineAction({
  handler: async (_, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) throw new Error("Unauthorized");

      const { data: courses } = await getEnrolledCoursesById({ id: currentUser.id });

      const coursesWithAssignments = await db.course.findMany({
        where: {
          enrolledUsers: {
            some: {
              mentorUsername: currentUser.username,
            },
          },
        },
        select: {
          id: true,
          classes: {
            select: {
              attachments: {
                where: {
                  attachmentType: "ASSIGNMENT",
                },
                include: {
                  class: true,
                  submissions: {
                    where: {
                      enrolledUser: {
                        user: {
                          id: currentUser.username,
                        },
                      },
                    },
                    include: {
                      points: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return { courses, coursesWithAssignments };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getAllMentorAssignments = defineAction({
  handler: async (_, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) {
        throw new Error("Unauthorized");
      }

      const coursesWithAssignments = await db.course.findMany({
        where: {
          enrolledUsers: {
            some: {
              mentorUsername: currentUser.username,
            },
          },
        },
        select: {
          id: true,
          classes: {
            select: {
              attachments: {
                where: {
                  attachmentType: "ASSIGNMENT",
                },
                select: {
                  title: true,
                  submissions: {
                    where: {
                      enrolledUser: {
                        mentorUsername: currentUser.username,
                      },
                    },
                    select: {
                      points: true,
                      enrolledUser: {
                        include: {
                          user: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const submissions = await db.submission.findMany({
        where: {
          enrolledUser: {
            mentorUsername: currentUser.username,
          },
        },
        select: {
          points: true,
          enrolledUser: {
            include: {
              user: true,
            },
          },
        },
      });

      return { coursesWithAssignments, submissions };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getAllCreatedAssignments = defineAction({
  handler: async (_, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) {
        throw new Error("Unauthorized");
      }

      return await db.course.findMany({
        where: {
          createdById: currentUser.id,
        },
        select: {
          id: true,
          classes: {
            select: {
              attachments: {
                where: {
                  attachmentType: "ASSIGNMENT",
                },
                include: {
                  class: true,
                  submissions: {
                    where: {
                      enrolledUserId: currentUser.id,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getAssignmentDetailsByUserId = defineAction({
  input: z.object({
    id: z.string()
  }),
  handler: async ({ id }, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser?.username) {
        throw new Error("Unauthorized");
      }

      return await db.attachment.findUnique({
        where: {
          id,
        },
        include: {
          class: {
            include: {
              course: true,
            },
          },
          submissions: {
            where: {
              enrolledUser: {
                user: {
                  id: currentUser.username,
                },
              },
            },
            include: {
              enrolledUser: {
                include: {
                  submission: true,
                },
              },
              points: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getAllAssignmentDetailsBy = defineAction({
  input: z.object({
    id: z.string()
  }),
  handler: async ({ id }, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) throw new Error("Unauthorized");

      const assignment = await db.attachment.findUnique({
        where: {
          id,
        },
        include: {
          class: {
            include: {
              course: true,
            },
          },
          submissions: {
            where: {
              enrolledUser: {
                mentorUsername: currentUser.username,
              },
            },
            include: {
              enrolledUser: {
                include: {
                  submission: true,
                },
              },
              points: true,
            },
          },
        },
      });

      const mentees = await db.user.findMany({
        where: {
          enrolledUsers: {
            some: {
              mentorUsername: currentUser.username,
            },
          },
        },
      });

      const notSubmittedMentees = mentees.filter((mentee) => {
        return !assignment?.submissions.some(
          (submission) => submission.enrolledUser.username === mentee.username,
        );
      });

      const sortedAssignments = assignment?.submissions.sort((a, b) => {
        if (b.enrolledUser.username > a.enrolledUser.username) {
          return -1;
        } else if (b.enrolledUser.username < a.enrolledUser.username) {
          return 1;
        } else {
          return 0;
        }
      });

      const isCourseAdmin =
        currentUser?.adminForCourses?.some(
          (course) => course.id === assignment?.courseId,
        ) ?? false;

      return [sortedAssignments, notSubmittedMentees, isCourseAdmin];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getAllAssignmentDetailsForInstructor = defineAction({
  input: z.object({
    id: z.string()
  }),
  handler: async ({ id }, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) throw new Error("Unauthorized");

      const assignment = await db.attachment.findUnique({
        where: {
          id,
        },
        include: {
          class: {
            include: {
              course: {
                where: {
                  createdById: currentUser.id,
                },
              },
            },
          },
          submissions: {
            include: {
              enrolledUser: {
                include: {
                  submission: true,
                },
              },
              points: true,
            },
          },
        },
      });

      const allStudents = await db.enrolledUsers.findMany({
        where: {
          course: {
            createdById: currentUser.id,
          },
          mentorUsername: {
            not: null,
          },
        },
      });

      const notSubmittedMentees = allStudents.filter((student) => {
        return !assignment?.submissions.some(
          (submission) => submission.enrolledUser.username === student.username,
        );
      });

      const sortedAssignments = assignment?.submissions.sort((a, b) => {
        if (b.enrolledUser.username > a.enrolledUser.username) {
          return -1;
        } else if (b.enrolledUser.username < a.enrolledUser.username) {
          return 1;
        } else {
          return 0;
        }
      });

      const isCourseAdmin =
        currentUser?.adminForCourses?.some(
          (course) => course.id === assignment?.courseId,
        ) ?? false;

      return [sortedAssignments, notSubmittedMentees, isCourseAdmin];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getAllAssignmentsByCourseId = defineAction({
  input: z.object({
    id: z.string()
  }),
  handler: async ({ id }, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) {
        throw new Error("Unauthorized");
      }

      return await db.course.findMany({
        where: {
          id,
        },
        select: {
          id: true,
          classes: {
            select: {
              attachments: {
                where: {
                  attachmentType: "ASSIGNMENT",
                },
                include: {
                  class: true,
                  submissions: {
                    where: {
                      enrolledUser: {
                        username: currentUser.username,
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getMentorPieChartData = defineAction({
  input: z.object({
    courseId: z.string()
  }),
  handler: async ({ courseId }, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) {
        throw new Error("Unauthorized");
      }

      let assignments, noOfTotalMentees;
      if (currentUser.role === "MENTOR") {
        assignments = await db.submission.findMany({
          where: {
            enrolledUser: {
              mentorUsername: currentUser.username,
              courseId,
            },
          },
          include: {
            points: true,
          },
        });
        noOfTotalMentees = await db.enrolledUsers.count({
          where: {
            mentorUsername: currentUser.username,
            courseId,
          },
        });
      } else {
        assignments = await db.submission.findMany({
          where: {
            assignment: {
              courseId,
            },
          },
          include: {
            points: true,
          },
        });
        noOfTotalMentees = await db.enrolledUsers.count({
          where: {
            courseId,
          },
        });
      }

      let assignmentsWithPoints = 0,
        assignmentsWithoutPoints = 0;
      assignments.forEach((assignment) => {
        if (assignment.points.length > 0) {
          assignmentsWithPoints += 1;
        } else {
          assignmentsWithoutPoints += 1;
        }
      });

      const noOfTotalAssignments = await db.attachment.count({
        where: {
          attachmentType: "ASSIGNMENT",
          courseId,
        },
      });

      const notSubmitted =
        noOfTotalAssignments * noOfTotalMentees -
        assignmentsWithPoints -
        assignmentsWithoutPoints;

      return [assignmentsWithPoints, assignmentsWithoutPoints, notSubmitted];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getMentorPieChartById = defineAction({
  input: z.object({
    id: z.string(),
    courseId: z.string()
  }),
  handler: async ({ id, courseId }, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) {
        throw new Error("Unauthorized");
      }

      const assignments = await db.submission.findMany({
        where: {
          enrolledUser: {
            mentorUsername: id,
          },
          assignment: {
            courseId,
          },
        },
        include: {
          points: true,
          assignment: {
            select: {
              maxSubmissions: true,
            },
          },
        },
      });

      const noOfTotalMentees = await db.enrolledUsers.count({
        where: {
          mentorUsername: id,
          courseId,
        },
      });

      let assignmentsWithPoints = 0,
        assignmentsWithoutPoints = 0;
      assignments.forEach((assignment) => {
        if (assignment.points.length > 0) {
          assignmentsWithPoints += 1;
        } else {
          assignmentsWithoutPoints += 1;
        }
      });

      const noOfTotalAssignments = await db.attachment.findMany({
        where: {
          attachmentType: "ASSIGNMENT",
          courseId,
        },
        select: {
          maxSubmissions: true,
        },
      });

      let totalAssignments = 0;
      noOfTotalAssignments.forEach((a) => {
        totalAssignments += a.maxSubmissions ?? 0;
      });

      const notSubmitted =
        totalAssignments - assignmentsWithPoints - assignmentsWithoutPoints;

      return {
        evaluated: assignments.length || 0,
        underReview: assignmentsWithoutPoints,
        unsubmitted: notSubmitted,
        totalPoints: assignments.reduce((total, assignment) =>
          total + assignment.points.reduce((sum, point) => sum + point.score, 0), 0),
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getSubmissionsForMentorByIdLineChart = defineAction({
  input: z.object({
    id: z.string(),
    courseId: z.string()
  }),
  handler: async ({ id, courseId }, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) {
        throw new Error("Unauthorized");
      }

      const submissionCount = await db.attachment.findMany({
        where: {
          attachmentType: "ASSIGNMENT",
          courseId,
        },
        include: {
          submissions: {
            where: {
              enrolledUser: {
                mentorUsername: id,
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return {
        assignments: submissionCount.map(submission => submission.title),
        countForEachAssignment: submissionCount.map(submission => submission.submissions.length)
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getSubmissionsForMentorLineChart = defineAction({
  input: z.object({
    courseId: z.string()
  }),
  handler: async ({ courseId }, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) {
        throw new Error("Unauthorized");
      }

      const submissionCount = await db.attachment.findMany({
        where: {
          attachmentType: "ASSIGNMENT",
          courseId,
        },
        include: {
          submissions: currentUser.role === "MENTOR" ? {
            where: {
              enrolledUser: {
                mentorUsername: currentUser.username,
              },
            },
          } : true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return {
        assignments: submissionCount.map(submission => submission.title),
        countForEachAssignment: submissionCount.map(submission => submission.submissions.length)
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getStudentEvaluatedAssigments = defineAction({
  input: z.object({
    courseId: z.string()
  }),
  handler: async ({ courseId }, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) {
        throw new Error("Unauthorized");
      }

      const assignments = await db.submission.findMany({
        where: {
          enrolledUser: {
            username: currentUser.username,
          },
          assignment: {
            courseId,
          },
        },
        include: {
          points: true,
        },
      });

      const evaluatedAssignments = assignments.filter(
        assignment => assignment.points.length > 0
      );

      const totalPoints = evaluatedAssignments.reduce((total, assignment) =>
        total + assignment.points.reduce((sum, point) => sum + point.score, 0), 0);

      const noOfTotalAssignments = await db.attachment.findMany({
        where: {
          attachmentType: "ASSIGNMENT",
          courseId,
        },
        select: {
          maxSubmissions: true,
        },
      });

      const totalAssignments = noOfTotalAssignments.reduce((total, assignment) =>
        total + (assignment.maxSubmissions ?? 0), 0);

      return {
        evaluated: evaluatedAssignments.length,
        underReview: assignments.length - evaluatedAssignments.length,
        unsubmitted: totalAssignments - assignments.length,
        totalPoints,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getStudentEvaluatedAssigmentsForMentor = defineAction({
  input: z.object({
    id: z.string(),
    courseId: z.string()
  }),
  handler: async ({ id, courseId }, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser) {
        throw new Error("Unauthorized");
      }

      const assignments = await db.submission.findMany({
        where: {
          enrolledUser: {
            username: id,
          },
          assignment: {
            courseId,
          },
        },
        include: {
          points: true,
          assignment: {
            select: {
              maxSubmissions: true,
            },
          },
        },
      });

      const evaluatedAssignments = assignments.filter(
        assignment => assignment.points.length > 0
      );

      const totalPoints = evaluatedAssignments.reduce((total, assignment) =>
        total + assignment.points.reduce((sum, point) => sum + point.score, 0), 0);

      const noOfTotalAssignments = await db.attachment.findMany({
        where: {
          attachmentType: "ASSIGNMENT",
          courseId,
        },
        select: {
          maxSubmissions: true,
        },
      });

      const totalAssignments = noOfTotalAssignments.reduce((total, assignment) =>
        total + (assignment.maxSubmissions ?? 0), 0);

      return {
        evaluated: evaluatedAssignments.length,
        underReview: assignments.length - evaluatedAssignments.length,
        unsubmitted: totalAssignments - assignments.length,
        totalPoints,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});

export const getAssignmentDetails = defineAction({
  input: z.object({
    id: z.string()
  }),
  handler: async ({ id }, context) => {
    try {
      const currentUser = getCurrentUser(context.locals);
      if (!currentUser?.username) {
        throw new Error("Unauthorized");
      }

      return await db.attachment.findUnique({
        where: {
          id,
        },
        include: {
          class: {
            include: {
              course: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }
});
