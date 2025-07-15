import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SavedArtistsService {
  constructor(private prisma: PrismaService) {}

  // Get all saved artists for a user
  async findAllArtists(userId: string, search?: string, limit: number = 50) {
    const where: Prisma.SavedArtistWhereInput = { userId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        {
          translations: {
            some: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    return this.prisma.savedArtist.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { lastUsed: 'desc' }
      ],
      take: limit,
      include: {
        translations: true,
        identifiers: true,
      }
    });
  }

  // Get all saved contributors for a user
  async findAllContributors(
    userId: string, 
    search?: string, 
    roles?: string[], 
    instruments?: string[], 
    limit: number = 50
  ) {
    const where: Prisma.SavedContributorWhereInput = { userId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        {
          translations: {
            some: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    if (roles && roles.length > 0) {
      where.roles = { hasEvery: roles };
    }

    if (instruments && instruments.length > 0) {
      where.instruments = { hasEvery: instruments };
    }

    return this.prisma.savedContributor.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { lastUsed: 'desc' }
      ],
      take: limit,
      include: {
        translations: true,
        identifiers: true,
      }
    });
  }

  // Create or update an artist
  async createOrUpdateArtist(userId: string, data: any) {
    // Check if artist already exists
    const existingArtist = await this.prisma.savedArtist.findFirst({
      where: {
        userId,
        name: data.name,
        identifiers: data.identifiers?.[0] ? {
          some: {
            type: data.identifiers[0].type,
            value: data.identifiers[0].value
          }
        } : undefined
      }
    });

    if (existingArtist) {
      // Update usage count and last used
      return this.prisma.savedArtist.update({
        where: { id: existingArtist.id },
        data: {
          usageCount: { increment: 1 },
          lastUsed: new Date()
        },
        include: {
          translations: true,
          identifiers: true,
        }
      });
    }

    // Create new artist
    return this.prisma.savedArtist.create({
      data: {
        userId,
        name: data.name,
        translations: {
          set: data.translations || []
        },
        identifiers: {
          set: data.identifiers || []
        }
      },
      include: {
        translations: true,
        identifiers: true,
      }
    });
  }

  // Create or update a contributor
  async createOrUpdateContributor(userId: string, data: any) {
    // Check if contributor already exists
    const existingContributor = await this.prisma.savedContributor.findFirst({
      where: {
        userId,
        name: data.name,
        roles: { hasEvery: data.roles || [] }
      }
    });

    if (existingContributor) {
      // Update with new data
      const updateData: any = {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      };

      // Add new instruments if provided
      if (data.instruments?.length) {
        const allInstruments = [...new Set([...existingContributor.instruments, ...data.instruments])];
        updateData.instruments = { set: allInstruments };
      }

      // Update identifiers if provided
      if (data.identifiers?.length) {
        updateData.identifiers = { set: data.identifiers };
      }

      // Update translations if provided
      if (data.translations?.length) {
        updateData.translations = { set: data.translations };
      }

      return this.prisma.savedContributor.update({
        where: { id: existingContributor.id },
        data: updateData,
        include: {
          translations: true,
          identifiers: true,
        }
      });
    }

    // Create new contributor
    return this.prisma.savedContributor.create({
      data: {
        userId,
        name: data.name,
        roles: data.roles || [],
        instruments: data.instruments || [],
        translations: {
          set: data.translations || []
        },
        identifiers: {
          set: data.identifiers || []
        }
      },
      include: {
        translations: true,
        identifiers: true,
      }
    });
  }

  // Update artist usage
  async updateArtistUsage(id: string, userId: string) {
    return this.prisma.savedArtist.update({
      where: { 
        id,
        userId // Ensure user owns the artist
      },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      },
      include: {
        translations: true,
        identifiers: true,
      }
    });
  }

  // Update contributor usage
  async updateContributorUsage(id: string, userId: string) {
    return this.prisma.savedContributor.update({
      where: { 
        id,
        userId // Ensure user owns the contributor
      },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      },
      include: {
        translations: true,
        identifiers: true,
      }
    });
  }

  // Delete artist
  async deleteArtist(id: string, userId: string) {
    return this.prisma.savedArtist.delete({
      where: { 
        id,
        userId // Ensure user owns the artist
      }
    });
  }

  // Delete contributor
  async deleteContributor(id: string, userId: string) {
    return this.prisma.savedContributor.delete({
      where: { 
        id,
        userId // Ensure user owns the contributor
      }
    });
  }
}