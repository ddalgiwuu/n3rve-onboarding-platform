import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SavedArtistsService {
  constructor(private prisma: PrismaService) {}

  // Helper to convert BigInt fields to Number for JSON serialization
  private convertArtistBigInt(artist: any) {
    if (!artist) return artist;
    return {
      ...artist,
      completionScore: artist.completionScore ? Number(artist.completionScore) : 0,
      releaseCount: artist.releaseCount ? Number(artist.releaseCount) : 0,
      usageCount: artist.usageCount ? Number(artist.usageCount) : 0
    };
  }

  private convertContributorBigInt(contributor: any) {
    if (!contributor) return contributor;
    return {
      ...contributor,
      usageCount: contributor.usageCount ? Number(contributor.usageCount) : 0
    };
  }

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
    // Safe stringify - no BigInt fields in this select
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

    // Convert BigInt fields to Number for JSON serialization
    const serializable = result.map(artist => this.convertArtistBigInt(artist));

    console.log('SavedArtistsService: Result details:', JSON.stringify(serializable, null, 2));
    return serializable;
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

    const result = await this.prisma.savedContributor.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },  // Show recently created contributors first
        { usageCount: 'desc' },
        { lastUsed: 'desc' }
      ],
      take: limit,
    });

    // Convert BigInt fields to Number for JSON serialization
    return result.map(contributor => this.convertContributorBigInt(contributor));
  }

  // Create or update an artist
  async createOrUpdateArtist(userId: string, data: any) {
    console.log('SavedArtistsService: createOrUpdateArtist called with userId:', userId);
    console.log('SavedArtistsService: createOrUpdateArtist data:', JSON.stringify(data, null, 2));

    try {
      let existingArtist: any = null;

      // If ID is provided, this is an explicit update request
      if (data.id) {
        console.log('SavedArtistsService: Explicit update by ID:', data.id);
        existingArtist = await this.prisma.savedArtist.findFirst({
          where: {
            id: data.id,
            userId // Ensure user owns the artist
          }
        });

        if (!existingArtist) {
          throw new Error('Artist not found or access denied');
        }

        // Update the existing artist with new data
        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name;
        // For composite types in MongoDB, assign directly without { set: ... }
        // Remove 'id' field from translations as Prisma schema only has language/name
        if (data.translations !== undefined) {
          updateData.translations = data.translations.map(({ language, name }: any) => ({
            language,
            name
          }));
        }
        if (data.identifiers !== undefined) {
          updateData.identifiers = data.identifiers.map(({ type, value, url }: any) => ({
            type,
            value,
            url: url || null
          }));
        }

        console.log('SavedArtistsService: Updating artist with data:', updateData);
        return this.prisma.savedArtist.update({
          where: { id: data.id },
          data: updateData
        });
      }

      // Check if artist already exists - BY NAME FIRST to prevent duplicates
      console.log('SavedArtistsService: Checking for existing artist by name:', data.name);
      existingArtist = await this.prisma.savedArtist.findFirst({
        where: {
          userId,
          name: data.name
        }
      });

      console.log('SavedArtistsService: Existing artist found:', existingArtist ? 'Yes' : 'No');
      if (existingArtist) {
        // Convert BigInt before stringify
        const safeArtist = this.convertArtistBigInt(existingArtist);
        console.log('SavedArtistsService: Existing artist details:', JSON.stringify(safeArtist, null, 2));
      }

      if (existingArtist) {
        console.log('SavedArtistsService: Updating existing artist with ID:', existingArtist.id);

        // Build update data - merge new information with existing
        const updateData: any = {
          usageCount: { increment: 1 },
          lastUsed: new Date()
        };

        // Update identifiers if provided and non-empty
        if (data.identifiers?.length) {
          const hasValidIdentifiers = data.identifiers.some((id: any) => id.value && id.value.trim());
          if (hasValidIdentifiers) {
            updateData.identifiers = data.identifiers;
          }
        }

        // Update translations if provided
        if (data.translations?.length) {
          updateData.translations = data.translations.map(({ language, name }: any) => ({
            language,
            name
          }));
        }

        const updatedArtist = await this.prisma.savedArtist.update({
          where: { id: existingArtist.id },
          data: updateData,
        });
        console.log('SavedArtistsService: Artist updated successfully:', updatedArtist);
        // Convert BigInt to Number
        return this.convertArtistBigInt(updatedArtist);
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
        translations: data.translations || [],
        identifiers: data.identifiers || []
      }, null, 2));

      let newArtist;
      try {
        // For composite types in MongoDB, assign directly without { set: ... }
        newArtist = await this.prisma.savedArtist.create({
          data: {
            userId,
            name: data.name,
            translations: data.translations || [],
            identifiers: data.identifiers || [],
            completionScore: BigInt(0),
            createdAt: new Date(),
            lastUsed: new Date(),
            releaseCount: BigInt(0),
            status: 'ACTIVE',
            updatedAt: new Date(),
            usageCount: BigInt(0),
          },
        });
        console.log('SavedArtistsService: Prisma create successful');
        // Convert BigInt before stringify
        const safeNewArtist = this.convertArtistBigInt(newArtist);
        console.log('SavedArtistsService: New artist created successfully:', JSON.stringify(safeNewArtist, null, 2));
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
          // Convert BigInt before stringify
          const safeVerifyArtist = this.convertArtistBigInt(verifyArtist);
          console.log('SavedArtistsService: Verified artist data:', JSON.stringify(safeVerifyArtist, null, 2));
        } else {
          console.warn('SavedArtistsService: WARNING - Artist created but not found in verification!');
        }
      } catch (verifyError) {
        console.error('SavedArtistsService: Verification error:', verifyError);
      }
      
      // Also count total artists to confirm
      const totalAfterCreate = await this.prisma.savedArtist.count();
      console.log('SavedArtistsService: Total artists after create:', totalAfterCreate);

      // Convert BigInt to Number
      return this.convertArtistBigInt(newArtist);
    } catch (error) {
      console.error('SavedArtistsService: Error in createOrUpdateArtist:', error);
      console.error('SavedArtistsService: Error details:', error.message);
      console.error('SavedArtistsService: Error stack:', error.stack);
      throw error;
    }
  }

  // Create or update a contributor
  async createOrUpdateContributor(userId: string, data: any) {
    // If ID is provided, this is an explicit update request
    if (data.id) {
      const existingContributor = await this.prisma.savedContributor.findFirst({
        where: {
          id: data.id,
          userId // Ensure user owns the contributor
        }
      });

      if (!existingContributor) {
        throw new Error('Contributor not found or access denied');
      }

      // Update the existing contributor with new data
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      // For scalar arrays, use { set: ... }
      if (data.roles !== undefined) updateData.roles = { set: data.roles };
      if (data.instruments !== undefined) updateData.instruments = { set: data.instruments };
      // For composite types in MongoDB, assign directly without { set: ... }
      // Remove 'id' field from translations as Prisma schema only has language/name
      if (data.translations !== undefined) {
        updateData.translations = data.translations.map(({ language, name }: any) => ({
          language,
          name
        }));
      }
      if (data.identifiers !== undefined) {
        updateData.identifiers = data.identifiers.map(({ type, value, url }: any) => ({
          type,
          value,
          url: url || null
        }));
      }

      const result = await this.prisma.savedContributor.update({
        where: { id: data.id },
        data: updateData
      });
      return this.convertContributorBigInt(result);
    }

    // Check if contributor already exists - BY NAME ONLY to prevent duplicates
    const existingContributor = await this.prisma.savedContributor.findFirst({
      where: {
        userId,
        name: data.name
      }
    });

    if (existingContributor) {
      // Update with new data - merge roles and instruments
      const updateData: any = {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      };

      // Merge roles if provided (deduplicate)
      if (data.roles?.length) {
        const allRoles = [...new Set([...existingContributor.roles, ...data.roles])];
        updateData.roles = { set: allRoles };
      }

      // Merge instruments if provided (deduplicate)
      if (data.instruments?.length) {
        const allInstruments = [...new Set([...existingContributor.instruments, ...data.instruments])];
        updateData.instruments = { set: allInstruments };
      }

      // Update identifiers if provided (composite type - assign directly)
      if (data.identifiers?.length) {
        updateData.identifiers = data.identifiers;
      }

      // Update translations if provided (composite type - assign directly)
      if (data.translations?.length) {
        updateData.translations = data.translations;
      }

      const result = await this.prisma.savedContributor.update({
        where: { id: existingContributor.id },
        data: updateData,
      });
      return this.convertContributorBigInt(result);
    }

    // Create new contributor
    const result = await this.prisma.savedContributor.create({
      data: {
        userId,
        name: data.name,
        roles: data.roles || [],
        instruments: data.instruments || [],
        // For composite types in MongoDB, assign directly without { set: ... }
        translations: data.translations || [],
        identifiers: data.identifiers || [],
        createdAt: new Date(),
        lastUsed: new Date(),
        usageCount: BigInt(0),
      },
    });
    return this.convertContributorBigInt(result);
  }

  // Update artist usage
  async updateArtistUsage(id: string, userId: string) {
    const result = await this.prisma.savedArtist.update({
      where: {
        id,
        userId // Ensure user owns the artist
      },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      },
    });
    return this.convertArtistBigInt(result);
  }

  // Update contributor usage
  async updateContributorUsage(id: string, userId: string) {
    const result = await this.prisma.savedContributor.update({
      where: {
        id,
        userId // Ensure user owns the contributor
      },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      },
    });
    return this.convertContributorBigInt(result);
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