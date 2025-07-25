import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SavedArtistsService {
  constructor(private prisma: PrismaService) {}

  // Get all saved artists for a user
  async findAllArtists(userId: string, search?: string, limit: number = 50) {
    console.log('SavedArtistsService: Finding artists for userId:', userId);
    console.log('SavedArtistsService: userId type:', typeof userId);
    
    // First, let's check if there are ANY artists in the database
    const totalCount = await this.prisma.savedArtist.count();
    console.log('SavedArtistsService: Total artists in database:', totalCount);
    
    // Check artists for this specific user
    const userArtistCount = await this.prisma.savedArtist.count({
      where: { userId }
    });
    console.log('SavedArtistsService: Artists for this user:', userArtistCount);
    
    // Get all artists (for debugging)
    const allArtists = await this.prisma.savedArtist.findMany({
      take: 5,
      select: {
        id: true,
        userId: true,
        name: true,
        createdAt: true
      }
    });
    console.log('SavedArtistsService: Sample of all artists:', JSON.stringify(allArtists, null, 2));
    
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

    console.log('SavedArtistsService: Query where clause:', JSON.stringify(where, null, 2));

    const result = await this.prisma.savedArtist.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },  // Show recently created artists first
        { usageCount: 'desc' },
        { lastUsed: 'desc' }
      ],
      take: limit,
    });
    
    console.log('SavedArtistsService: Found artists:', result.length);
    console.log('SavedArtistsService: Result details:', JSON.stringify(result, null, 2));
    return result;
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
        { createdAt: 'desc' },  // Show recently created contributors first
        { usageCount: 'desc' },
        { lastUsed: 'desc' }
      ],
      take: limit,
    });
  }

  // Create or update an artist
  async createOrUpdateArtist(userId: string, data: any) {
    console.log('SavedArtistsService: createOrUpdateArtist called with userId:', userId);
    console.log('SavedArtistsService: createOrUpdateArtist data:', JSON.stringify(data, null, 2));
    
    try {
      let existingArtist: any = null;
      
      // Check if artist already exists - only if we have identifiers
      if (data.identifiers && data.identifiers.length > 0) {
        console.log('SavedArtistsService: Checking for existing artist with identifiers...');
        existingArtist = await this.prisma.savedArtist.findFirst({
          where: {
            userId,
            name: data.name,
            identifiers: {
              some: {
                type: data.identifiers[0].type,
                value: data.identifiers[0].value
              }
            }
          }
        });
      } else {
        console.log('SavedArtistsService: No identifiers provided, checking for existing artist by name only...');
        // For new artists without identifiers, we might still want to check by name
        // but we'll be more lenient about creating duplicates
        existingArtist = await this.prisma.savedArtist.findFirst({
          where: {
            userId,
            name: data.name,
            // Only match if both have no identifiers
            identifiers: {
              none: {}
            }
          }
        });
      }

      console.log('SavedArtistsService: Existing artist found:', existingArtist ? 'Yes' : 'No');
      if (existingArtist) {
        console.log('SavedArtistsService: Existing artist details:', JSON.stringify(existingArtist, null, 2));
      }

      if (existingArtist) {
        console.log('SavedArtistsService: Updating existing artist with ID:', existingArtist.id);
        // Update usage count and last used
        const updatedArtist = await this.prisma.savedArtist.update({
          where: { id: existingArtist.id },
          data: {
            usageCount: { increment: 1 },
            lastUsed: new Date()
          },
        });
        console.log('SavedArtistsService: Artist updated successfully:', updatedArtist);
        return updatedArtist;
      }

      // Create new artist
      console.log('SavedArtistsService: Creating new artist...');
      console.log('SavedArtistsService: Artist data to create:', {
        userId,
        name: data.name,
        translations: data.translations || [],
        identifiers: data.identifiers || []
      });
      
      console.log('SavedArtistsService: Attempting to create artist with Prisma...');
      console.log('SavedArtistsService: Prisma data object:', JSON.stringify({
        userId,
        name: data.name,
        translations: {
          set: data.translations || []
        },
        identifiers: {
          set: data.identifiers || []
        }
      }, null, 2));
      
      let newArtist;
      try {
        newArtist = await this.prisma.savedArtist.create({
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
        });
        console.log('SavedArtistsService: Prisma create successful');
        console.log('SavedArtistsService: New artist created successfully:', JSON.stringify(newArtist, null, 2));
      } catch (createError) {
        console.error('SavedArtistsService: Prisma create failed:', createError);
        console.error('SavedArtistsService: Create error message:', createError.message);
        console.error('SavedArtistsService: Create error code:', createError.code);
        console.error('SavedArtistsService: Create error stack:', createError.stack);
        throw createError;
      }
      
      // Verify the artist was actually saved
      console.log('SavedArtistsService: Verifying artist was saved...');
      try {
        const verifyArtist = await this.prisma.savedArtist.findUnique({
          where: { id: newArtist.id }
        });
        console.log('SavedArtistsService: Verification - artist exists in DB:', verifyArtist ? 'YES' : 'NO');
        if (verifyArtist) {
          console.log('SavedArtistsService: Verified artist data:', JSON.stringify(verifyArtist, null, 2));
        } else {
          console.warn('SavedArtistsService: WARNING - Artist created but not found in verification!');
        }
      } catch (verifyError) {
        console.error('SavedArtistsService: Verification error:', verifyError);
      }
      
      // Also count total artists to confirm
      const totalAfterCreate = await this.prisma.savedArtist.count();
      console.log('SavedArtistsService: Total artists after create:', totalAfterCreate);
      
      return newArtist;
    } catch (error) {
      console.error('SavedArtistsService: Error in createOrUpdateArtist:', error);
      console.error('SavedArtistsService: Error details:', error.message);
      console.error('SavedArtistsService: Error stack:', error.stack);
      throw error;
    }
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