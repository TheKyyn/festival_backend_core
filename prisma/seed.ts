import 'dotenv/config'

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Même coût que la configuration par défaut de l'application (BCRYPT_ROUNDS).
const BCRYPT_ROUNDS = 10

const prisma = new PrismaClient()

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

const USERS = [
  { id: 'seed-user-admin', email: 'admin@festival.fr', password: 'Admin123!', role: 'ADMIN' },
  { id: 'seed-user-organizer', email: 'organizer@festival.fr', password: 'Organizer123!', role: 'ORGANIZER' },
  { id: 'seed-user-staff', email: 'staff@festival.fr', password: 'Staff123!', role: 'STAFF' },
  { id: 'seed-user-visitor', email: 'visitor@festival.fr', password: 'Visitor123!', role: 'VISITOR' },
]

async function main(): Promise<void> {
  const now = new Date()

  // Utilisateurs (upsert par id -> idempotent).
  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS)
    await prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email, passwordHash, role: user.role, createdAt: now },
      update: { email: user.email, passwordHash, role: user.role },
    })
  }

  // Lieu.
  const venue = {
    name: 'Maison Européenne de la Photographie',
    address: '5-7 Rue de Fourcy, 75004 Paris',
    capacity: 200,
  }
  await prisma.venue.upsert({
    where: { id: 'seed-venue-mep' },
    create: { id: 'seed-venue-mep', ...venue },
    update: venue,
  })

  // Événement / exposition.
  const event = {
    title: 'Regards Contemporains — Festival International de Photographie',
    description: "Exposition phare du festival, à la Maison Européenne de la Photographie.",
    venueId: 'seed-venue-mep',
    organizerId: 'seed-user-organizer',
    startDate: new Date(now.getTime() + 30 * DAY_MS),
    endDate: new Date(now.getTime() + 40 * DAY_MS),
  }
  await prisma.event.upsert({
    where: { id: 'seed-event-1' },
    create: { id: 'seed-event-1', ...event, createdAt: now },
    update: event,
  })

  // Créneau ouvert à tous.
  const openSlot = {
    eventId: 'seed-event-1',
    startTime: new Date(now.getTime() + 30 * DAY_MS),
    endTime: new Date(now.getTime() + 30 * DAY_MS + 2 * HOUR_MS),
    capacity: 20,
    allowedRoles: [] as string[],
  }
  await prisma.slot.upsert({
    where: { id: 'seed-slot-open' },
    create: { id: 'seed-slot-open', ...openSlot },
    update: openSlot,
  })

  // Créneau réservé (vernissage privé) : organisateurs et administrateurs.
  const restrictedSlot = {
    eventId: 'seed-event-1',
    startTime: new Date(now.getTime() + 31 * DAY_MS),
    endTime: new Date(now.getTime() + 31 * DAY_MS + 2 * HOUR_MS),
    capacity: 10,
    allowedRoles: ['ORGANIZER', 'ADMIN'],
  }
  await prisma.slot.upsert({
    where: { id: 'seed-slot-restricted' },
    create: { id: 'seed-slot-restricted', ...restrictedSlot },
    update: restrictedSlot,
  })

  // Réservation exemple : le visiteur sur le créneau ouvert, en attente.
  // La contrainte @@unique([userId, slotId]) empêche tout doublon ; l'upsert par id
  // remet le statut à PENDING à chaque exécution.
  await prisma.reservation.upsert({
    where: { id: 'seed-reservation-1' },
    create: {
      id: 'seed-reservation-1',
      userId: 'seed-user-visitor',
      slotId: 'seed-slot-open',
      status: 'PENDING',
      createdAt: now,
    },
    update: { status: 'PENDING' },
  })

  console.log('Seed termine : 4 utilisateurs, 1 lieu, 1 evenement, 2 creneaux, 1 reservation.')
}

main()
  .then(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error)
    return prisma.$disconnect().finally(() => process.exit(1))
  })
