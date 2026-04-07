import { supabase } from './supabase';
import type { Profile } from '@/contexts/AuthContext';

// ============================================================================
// UTILS: snake_case <-> camelCase
// ============================================================================

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** Convertit un objet Supabase (snake_case) en camelCase pour l'app */
export function toCamelCase<T = Record<string, any>>(obj: Record<string, any>): T {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj as T;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = value;
  }
  return result as T;
}

/** Convertit un objet app (camelCase) en snake_case pour Supabase */
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result;
}

// ============================================================================
// PROFILES
// ============================================================================

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data: data as Profile | null, error };
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

// ============================================================================
// VENUES
// ============================================================================

export async function getVenuesByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

export async function getVenue(venueId: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

function mapVenueToDb(venue: Record<string, any>) {
  return {
    owner_id: venue.owner_id,
    name: venue.name || '',
    address: venue.address || '',
    city: venue.city || '',
    zip_code: venue.zipCode || venue.zip_code || '',
    category: venue.category || '',
    capacity: venue.capacity || null,
    surface: venue.surface || null,
    team_size: venue.teamSize || venue.team_size || null,
    // Access
    access_digicode: venue.access?.digicode || null,
    access_contact_name: venue.access?.contactName || null,
    access_contact_phone: venue.access?.contactPhone || null,
    access_instructions: venue.access?.instructions || null,
    access_wifi_ssid: venue.access?.wifiSSID || null,
    access_wifi_password: venue.access?.wifiPassword || null,
    // Technical
    tech_elec_type: venue.technical?.elecType || null,
    tech_gas_type: venue.technical?.gasType || null,
    tech_has_freight_elevator: venue.technical?.hasFreightElevator || false,
    tech_has_elevator: venue.technical?.hasElevator || false,
    tech_delivery_access: venue.technical?.deliveryAccess || null,
    tech_has_ventilation: venue.technical?.hasVentilation || false,
    tech_has_air_conditioning: venue.technical?.hasAirConditioning || false,
    // Equipment
    equip_pos_system: venue.equipment?.posSystem || null,
    equip_has_terrace: venue.equipment?.hasTerrace || false,
    equip_has_private_rooms: venue.equipment?.hasPrivateRooms || false,
    equip_has_bar: venue.equipment?.hasBar || false,
  };
}

export async function createVenue(venue: Record<string, any>) {
  const { data, error } = await supabase
    .from('venues')
    .insert(mapVenueToDb(venue))
    .select()
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

export async function updateVenue(venueId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('venues')
    .update(mapVenueToDb(updates))
    .eq('id', venueId)
    .select()
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

export async function deleteVenue(venueId: string) {
  const { error } = await supabase
    .from('venues')
    .delete()
    .eq('id', venueId);
  return { error };
}

// ============================================================================
// EQUIPMENT
// ============================================================================

export async function getEquipmentByVenue(venueId: string) {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

export async function getEquipmentByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

export async function createEquipment(equipment: Record<string, any>) {
  const { data, error } = await supabase
    .from('equipment')
    .insert(toSnakeCase(equipment))
    .select()
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

export async function updateEquipment(equipmentId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('equipment')
    .update(toSnakeCase(updates))
    .eq('id', equipmentId)
    .select()
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

export async function softDeleteEquipment(equipmentId: string) {
  const { error } = await supabase
    .from('equipment')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', equipmentId);
  return { error };
}

// ============================================================================
// MISSIONS
// ============================================================================

export async function getMissionsByPatron(patronId: string) {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('patron_id', patronId)
    .order('created_at', { ascending: false });
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

export async function getMissionsByProvider(providerId: string) {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

export async function getSearchingMissions() {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('status', 'SEARCHING')
    .order('created_at', { ascending: false });
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

export async function getMission(missionId: string) {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('id', missionId)
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

export async function createMission(mission: Record<string, any>) {
  const { data, error } = await supabase
    .from('missions')
    .insert(toSnakeCase(mission))
    .select()
    .single();
  if (error) console.error('[createMission] Supabase error:', error.message, error.details);
  return { data: data ? toCamelCase(data) : null, error };
}

export async function updateMission(missionId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('missions')
    .update(toSnakeCase(updates))
    .eq('id', missionId)
    .select()
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

// ============================================================================
// MISSION CANDIDATES
// ============================================================================

export async function getCandidatesByMission(missionId: string) {
  const { data, error } = await supabase
    .from('mission_candidates')
    .select('*')
    .eq('mission_id', missionId)
    .order('applied_at', { ascending: false });
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

export async function applyToMission(candidate: Record<string, any>) {
  const { data, error } = await supabase
    .from('mission_candidates')
    .insert(toSnakeCase(candidate))
    .select()
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

export async function getMyCandidatures(workerId: string) {
  const { data, error } = await supabase
    .from('mission_candidates')
    .select('*, missions(*)')
    .eq('worker_id', workerId)
    .order('applied_at', { ascending: false });
  return { data: (data ?? []).map(d => ({
    ...toCamelCase(d),
    mission: d.missions ? toCamelCase(d.missions) : null,
  })), error };
}

export async function cancelCandidature(candidateId: string) {
  const { error } = await supabase
    .from('mission_candidates')
    .delete()
    .eq('id', candidateId);
  return { error };
}

export async function updateCandidateStatus(candidateId: string, status: 'ACCEPTED' | 'REJECTED') {
  const { error } = await supabase
    .from('mission_candidates')
    .update({ status })
    .eq('id', candidateId);
  return { error };
}

// ============================================================================
// REVIEWS
// ============================================================================

export async function createReview(review: Record<string, any>) {
  const { data, error } = await supabase
    .from('mission_reviews')
    .insert(toSnakeCase(review))
    .select()
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

export async function getReviewsByMission(missionId: string) {
  const { data, error } = await supabase
    .from('mission_reviews')
    .select('*')
    .eq('mission_id', missionId);
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

// ============================================================================
// DISPUTES
// ============================================================================

export async function createDispute(dispute: Record<string, any>) {
  const { data, error } = await supabase
    .from('mission_disputes')
    .insert(toSnakeCase(dispute))
    .select()
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

export async function updateDispute(disputeId: string, updates: Record<string, any>) {
  const { error } = await supabase
    .from('mission_disputes')
    .update(updates)
    .eq('id', disputeId);
  return { error };
}

// ============================================================================
// QUOTES
// ============================================================================

export async function createQuote(quote: Record<string, any>) {
  const { data, error } = await supabase
    .from('quotes')
    .insert(toSnakeCase(quote))
    .select()
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

export async function getQuotesByMission(missionId: string) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items(*)')
    .eq('mission_id', missionId);
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

export async function updateQuoteStatus(quoteId: string, status: string) {
  const { error } = await supabase
    .from('quotes')
    .update({ status })
    .eq('id', quoteId);
  return { error };
}

// ============================================================================
// INVOICES
// ============================================================================

export async function createInvoice(invoice: Record<string, any>) {
  const { data, error } = await supabase
    .from('invoices')
    .insert(toSnakeCase(invoice))
    .select()
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

export async function getInvoicesByMission(missionId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('mission_id', missionId);
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

// ============================================================================
// PAYSLIPS
// ============================================================================

export async function getPayslipsByVenue(venueId: string) {
  const { data, error } = await supabase
    .from('payslips')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_deleted', false)
    .order('issue_date', { ascending: false });
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

export async function getPayslipsByEmployee(employeeId: string) {
  const { data, error } = await supabase
    .from('payslips')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('is_deleted', false)
    .order('issue_date', { ascending: false });
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

// ============================================================================
// STOCK
// ============================================================================

export async function getStockByVenue(venueId: string) {
  const { data, error } = await supabase
    .from('stock_items')
    .select('*')
    .eq('venue_id', venueId)
    .order('name');
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

export async function upsertStockItem(item: Record<string, any>) {
  const { data, error } = await supabase
    .from('stock_items')
    .upsert(toSnakeCase(item))
    .select()
    .single();
  return { data: data ? toCamelCase(data) : null, error };
}

export async function deleteStockItem(itemId: string) {
  const { error } = await supabase
    .from('stock_items')
    .delete()
    .eq('id', itemId);
  return { error };
}

// ============================================================================
// CALENDAR
// ============================================================================

export async function getCalendarEvents(userId: string, month?: string) {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (month) {
    const start = `${month}-01`;
    const end = `${month}-31`;
    query = query.gte('date', start).lte('date', end);
  }

  const { data, error } = await query;
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

export async function createCalendarEvent(event: Record<string, any>) {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(toSnakeCase(event))
    .select()
    .single();
  if (error) console.error('[createCalendarEvent] Supabase error:', error.message, error.details);
  return { data: data ? toCamelCase(data) : null, error };
}

export async function deleteCalendarEvent(eventId: string) {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);
  return { error };
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return { data: (data ?? []).map(d => toCamelCase(d)), error };
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  return { error };
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  return { error };
}

export async function createNotification(notification: Record<string, any>) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single();
  return { data, error };
}

// ============================================================================
// TEAM MEMBERS
// ============================================================================

export async function getTeamByPatron(patronId: string) {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('patron_id', patronId)
    .order('name');
  return { data: data ?? [], error };
}

export async function addTeamMember(member: Record<string, any>) {
  const { data, error } = await supabase
    .from('team_members')
    .insert(member)
    .select()
    .single();
  return { data, error };
}

export async function removeTeamMember(memberId: string) {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId);
  return { error };
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

export async function getActiveSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return { data, error };
}

export async function createSubscription(sub: Record<string, any>) {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert(sub)
    .select()
    .single();
  return { data, error };
}

// ============================================================================
// DPAE
// ============================================================================

export async function createDPAE(dpae: Record<string, any>) {
  const { data, error } = await supabase
    .from('dpae_declarations')
    .insert(dpae)
    .select()
    .single();
  return { data, error };
}

export async function getDPAEByMission(missionId: string) {
  const { data, error } = await supabase
    .from('dpae_declarations')
    .select('*, dpae_contracts(*)')
    .eq('mission_id', missionId);
  return { data: data ?? [], error };
}

// ============================================================================
// WORKER COMPLIANCE
// ============================================================================

export async function getWorkerCompliance(workerId: string) {
  const { data, error } = await supabase
    .from('worker_compliance')
    .select('*, compliance_documents(*)')
    .eq('worker_id', workerId)
    .single();
  return { data, error };
}

export async function upsertWorkerCompliance(compliance: Record<string, any>) {
  const { data, error } = await supabase
    .from('worker_compliance')
    .upsert(compliance)
    .select()
    .single();
  return { data, error };
}

// ============================================================================
// STORED DOCUMENTS (GED)
// ============================================================================

export async function getDocumentsByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from('stored_documents')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  return { data: data ?? [], error };
}

export async function createDocument(doc: Record<string, any>) {
  const { data, error } = await supabase
    .from('stored_documents')
    .insert(doc)
    .select()
    .single();
  return { data, error };
}

export async function deleteDocument(docId: string) {
  const { error } = await supabase
    .from('stored_documents')
    .delete()
    .eq('id', docId);
  return { error };
}

// ============================================================================
// MAINTENANCE RECORDS
// ============================================================================

export async function getMaintenanceByEquipment(equipmentId: string) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('date', { ascending: false });
  return { data: data ?? [], error };
}

export async function createMaintenanceRecord(record: Record<string, any>) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .insert(record)
    .select()
    .single();
  return { data, error };
}
