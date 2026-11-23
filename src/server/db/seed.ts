import type { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { UAE_BANKS, UAE_CHART_OF_ACCOUNTS, UAE_DEVELOPERS, UAE_PROJECTS } from '@/data/uae-registry';
import { hashPassword } from '@/server/auth';
import { OFFICIAL_STAFF_DIRECTORY } from '@/lib/staff-directory';

export function seedInitialData(db: DatabaseSync) {
  const existing = db.prepare('SELECT COUNT(*) as c FROM company_settings').get() as { c: number };
  if (existing.c > 0) return;

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(
      `INSERT INTO company_settings (
        id, legal_name, trade_licence_no, rera_orn, cbuae_broker_reg, vat_trn_15,
        corporate_tax_tin, mohre_establishment_id, wps_routing_bank_code, wps_iban,
        peppol_endpoint_id, office_address, house_clawback_provision_bps
      ) VALUES (
        1, 'Betterway Mortgages LLC', 'DED-1084921', 'ORN-31910', 'CBUAE-MB-2025-041',
        '100482910400003', 'CT-902841102', '0000849201421', '302620122',
        'AE470260001015829401201', '0235:100482910400003',
        'Al Nasr Plaza, Plot 319-310, Oud Metha Road, Oud Metha, Dubai, UAE', 1000
      )`,
    ).run();

    for (const [code, name, accountType] of UAE_CHART_OF_ACCOUNTS) {
      db.prepare('INSERT INTO gl_accounts (code, name, account_type) VALUES (?, ?, ?)').run(code, name, accountType);
    }

    const defaultPass = hashPassword('Betterway#2026');
    const insertUser = db.prepare(
      `INSERT INTO users (email, phone, full_name_en, full_name_ar, password_hash, role, is_mlro, can_approve_rates, preferred_lang)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const mdId = Number(
      insertUser.run('md@betterwaymortgages.com', '+971501001001', 'Shabib Siraj', 'شبيب سراج', defaultPass, 'SUPER_ADMIN', 1, 1, 'en').lastInsertRowid,
    );
    insertUser.run('ops.director@betterwaymortgages.com', '+971501001002', 'Rami Haddad', 'رامي حداد', defaultPass, 'SUPER_ADMIN', 0, 1, 'en');
    const advisorId = Number(
      insertUser.run('tariq.advisor@betterwaymortgages.com', '+971501001003', 'Tariq Al Mansoori', 'طارق المنصوري', defaultPass, 'SALES_ADVISOR', 0, 0, 'en').lastInsertRowid,
    );
    const headCreditId = Number(
      insertUser.run('layla.credit@betterwaymortgages.com', '+971501001004', 'Layla Khoury', 'ليلى خوري', defaultPass, 'CREDIT_UNDERWRITER', 0, 1, 'en').lastInsertRowid,
    );
    const makerCreditId = Number(
      insertUser.run('omar.underwriter@betterwaymortgages.com', '+971501001005', 'Omar Siddiqui', 'عمر صديقي', defaultPass, 'CREDIT_UNDERWRITER', 0, 0, 'en').lastInsertRowid,
    );
    const progId = Number(
      insertUser.run('nadia.conveyancing@betterwaymortgages.com', '+971501001006', 'Nadia Al Zaabi', 'نادية الزعابي', defaultPass, 'PROGRESSION_MANAGER', 0, 0, 'en').lastInsertRowid,
    );
    const mlroId = Number(
      insertUser.run('farid.mlro@betterwaymortgages.com', '+971501001007', 'Farid Qureshi', 'فريد قريشي', defaultPass, 'COMPLIANCE_MLRO', 1, 0, 'en').lastInsertRowid,
    );
    insertUser.run('sana.finance@betterwaymortgages.com', '+971501001008', 'Sana Nair', 'سناء ناير', defaultPass, 'FINANCE_ADMIN', 0, 0, 'en');
    insertUser.run('reem.hr@betterwaymortgages.com', '+971501001009', 'Reem Al الهاشمي', 'ريم الهاشمي', defaultPass, 'HR_MANAGER', 0, 0, 'ar');

    // Official SWK / Betterway Executive & Staff Roster (Shabib Siraj, Admin, Mohammad Haseeb, Talha Shabbir)
    const shabibId = Number(
      insertUser.run('shabib@betterwaymortgages.com', '+971501000001', 'Shabib Siraj', 'شبيب سراج', defaultPass, 'SUPER_ADMIN', 1, 1, 'en').lastInsertRowid,
    );
    insertUser.run('admin@betterwaymortgages.com', '+971501000000', 'Betterway Admin', 'مسؤول النظام', defaultPass, 'SUPER_ADMIN', 1, 1, 'en');
    const haseebId = Number(
      insertUser.run('haseeb@betterwaymortgages.com', '+971501000002', 'Mohammad Haseeb', 'محمد حسيب', defaultPass, 'SUPER_ADMIN', 0, 1, 'en').lastInsertRowid,
    );
    insertUser.run('talha@betterwaymortgages.com', '+971501000003', 'Talha Shabbir', 'طلحة شبير', defaultPass, 'SALES_ADVISOR', 0, 0, 'en');

    const agencyOwnerUserId = Number(
      insertUser.run('owner@partner.ae', '+971502002001', 'Zayd Al Maktoum', 'زيد المكتوم', defaultPass, 'PARTNER_AGENCY_ADMIN', 0, 0, 'en').lastInsertRowid,
    );
    const agent1UserId = Number(
      insertUser.run('agent.brn1@partner.ae', '+971502002002', 'Karim Darwish', 'كريم درويش', defaultPass, 'PARTNER_AGENT', 0, 0, 'en').lastInsertRowid,
    );
    const agent2UserId = Number(
      insertUser.run('agent.brn2@partner.ae', '+971502002003', 'Elena Petrova', 'إيلينا بيتروفا', defaultPass, 'PARTNER_AGENT', 0, 0, 'en').lastInsertRowid,
    );

    const client1UserId = Number(
      insertUser.run('client.khalid@example.ae', '+971503003001', 'Khalid Al Nuaimi', 'خالد النعيمي', defaultPass, 'CLIENT', 0, 0, 'en').lastInsertRowid,
    );
    const client1SpouseUserId = Number(
      insertUser.run('client.sara@example.ae', '+971503003002', 'Sara Al Nuaimi', 'سارة النعيمي', defaultPass, 'CLIENT', 0, 0, 'ar').lastInsertRowid,
    );
    const client2UserId = Number(
      insertUser.run('client.james@example.co.uk', '+447700900123', 'James Thornton', 'جيمس ثورنتون', defaultPass, 'CLIENT', 0, 0, 'en').lastInsertRowid,
    );

    // Seed 24 UAE Banks + Active Rate Cards + Subvention Slabs + BDMs
    const insertBank = db.prepare(
      `INSERT INTO banks (
        slug, bank_key, name_en, name_ar, short_name, logo_path, structure, hq_emirate,
        stress_rate_bps, card_limit_dbr_bps, accepts_non_resident, accepts_external_life, clawback_window_months
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertRate = db.prepare(
      `INSERT INTO bank_rate_cards (
        bank_id, product_code, finance_mode, residency_scope, stl_required, fixed_years,
        intro_rate_bps, eibor_tenor, revert_margin_bps, floor_rate_bps, arrangement_fee_bps,
        buyout_fee_bps, free_overpay_cap_bps, min_salary_fils, status, created_by, approved_by, effective_from
      ) VALUES (?, ?, ?, 'ALL', 1, ?, ?, '3M', ?, ?, 105, 0, 1000, 1500000, 'ACTIVE', ?, ?, '2026-01-01')`,
    );
    const insertSubv = db.prepare(
      `INSERT INTO bank_subvention_grids (bank_id, monthly_volume_min_fils, monthly_volume_max_fils, commission_bps, max_payout_cap_fils, vat_mode)
       VALUES (?, ?, ?, ?, ?, 'EXCLUSIVE_5PCT')`,
    );
    const insertBdm = db.prepare(
      `INSERT INTO bank_bdm_contacts (bank_id, segment, bdm_name, email, phone, avg_ipa_tat_days, avg_fol_tat_days)
       VALUES (?, 'Residential & HNW', ?, ?, '+97143009000', 3, 5)`,
    );

    const bankIdMap = new Map<string, number>();
    const rateCardIdMap = new Map<string, number>();

    for (const b of UAE_BANKS) {
      const bankId = Number(
        insertBank.run(
          b.slug,
          b.key,
          b.name,
          b.ar,
          b.short,
          b.logo,
          b.structure,
          b.hq,
          b.stressRateBps,
          b.cardDbrBps,
          b.acceptsNonResident,
          b.acceptsExternalLife,
          b.clawbackMonths,
        ).lastInsertRowid,
      );
      bankIdMap.set(b.key, bankId);

      const mode = b.structure === 'ISLAMIC' ? 'IJARA' : 'CONVENTIONAL';
      const rc2y = Number(
        insertRate.run(bankId, `${b.short}-2Y-STL`, mode, 2, b.intro2yBps, b.revertMarginBps, b.floorBps, makerCreditId, headCreditId).lastInsertRowid,
      );
      rateCardIdMap.set(b.key, rc2y);
      insertRate.run(bankId, `${b.short}-3Y-STL`, mode, 3, b.intro3yBps, b.revertMarginBps, b.floorBps, makerCreditId, headCreditId);

      // Standard volume tier (< AED 25M/mo) and Retro-Bonus Tier (>= AED 25M/mo adds +15 bps)
      insertSubv.run(bankId, 0, 2_500_000_000, b.subventionBps, 10_000_000);
      insertSubv.run(bankId, 2_500_000_000, null, b.subventionBps + 15, 15_000_000);
      insertBdm.run(bankId, `${b.short} Broker Desk`, `brokerdesk@${b.key}.ae`);
    }

    // Also add 1 PENDING_APPROVAL rate card to showcase Maker-Checker queue in UI
    db.prepare(
      `INSERT INTO bank_rate_cards (
        bank_id, product_code, finance_mode, residency_scope, stl_required, fixed_years,
        intro_rate_bps, eibor_tenor, revert_margin_bps, floor_rate_bps, status, created_by, effective_from
      ) VALUES (?, 'ENBD-5Y-CAMPAIGN', 'CONVENTIONAL', 'RESIDENT_ONLY', 1, 5, 429, '3M', 150, 299, 'PENDING_APPROVAL', ?, '2026-11-15')`,
    ).run(bankIdMap.get('emirates-nbd')!, makerCreditId);

    // Seed EIBOR snapshot fixings
    try {
      const snapRaw = readFileSync(path.resolve(process.cwd(), 'src/data/eibor-snapshot.json'), 'utf8');
      const snap = JSON.parse(snapRaw) as {
        history: { date: string; valueDate: string; overnight: number; oneMonth: number; threeMonth: number; sixMonth: number; oneYear: number }[];
      };
      const insEibor = db.prepare(
        `INSERT OR IGNORE INTO eibor_fixings (
          fixing_date, value_date, overnight_micro, one_month_micro, three_month_micro, six_month_micro, one_year_micro, source_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'CBUAE_VERIFIED')`,
      );
      for (const h of snap.history.slice(-15)) {
        insEibor.run(
          h.date,
          h.valueDate,
          Math.round(h.overnight * 100_000),
          Math.round(h.oneMonth * 100_000),
          Math.round(h.threeMonth * 100_000),
          Math.round(h.sixMonth * 100_000),
          Math.round(h.oneYear * 100_000),
        );
      }
    } catch {
      db.prepare(
        `INSERT INTO eibor_fixings (fixing_date, value_date, overnight_micro, one_month_micro, three_month_micro, six_month_micro, one_year_micro, source_status)
         VALUES ('2026-11-06', '2026-11-10', 366539, 414250, 420677, 468714, 480361, 'CBUAE_VERIFIED')`,
      ).run();
    }

    // Seed 23 Developers & 80 Off-Plan Projects + Tower APL rows
    const devIdMap = new Map<string, number>();
    const insDev = db.prepare('INSERT INTO developers (slug, name, escrow_info) VALUES (?, ?, ?)');
    for (const d of UAE_DEVELOPERS) {
      devIdMap.set(d.slug, Number(insDev.run(d.slug, d.name, d.escrow).lastInsertRowid));
    }

    const insProj = db.prepare('INSERT INTO projects (slug, developer_id, name, community, completion_status) VALUES (?, ?, ?, ?, ?)');
    const insApl = db.prepare(
      `INSERT INTO bank_project_apl (bank_id, project_id, tower_name, apl_status, max_ltv_bps, valuation_basis, updated_by)
       VALUES (?, ?, 'All Towers', ?, ?, 'FRESH_MARKET_VAL', ?)`,
    );

    const coreAplBanks = ['emirates-nbd', 'dib', 'fab', 'hsbc', 'adcb', 'adib'];
    let firstProjId = 1;
    UAE_PROJECTS.forEach((pr, idx) => {
      const pid = Number(insProj.run(pr.slug, devIdMap.get(pr.dev)!, pr.name, pr.community, idx % 4 === 0 ? 'UNDER_CONSTRUCTION' : 'HANDOVER_READY').lastInsertRowid);
      if (idx === 0) firstProjId = pid;
      if (idx < 12) {
        for (const bk of coreAplBanks) {
          const status = bk === 'hsbc' && idx === 3 ? 'BLOCKED' : 'APPROVED';
          insApl.run(bankIdMap.get(bk)!, pid, status, status === 'BLOCKED' ? 0 : 8000, headCreditId);
        }
      }
    });

    // Seed Partner Agency & 3 Partner Users (1 Agency Owner + 2 Individual BRN Agents)
    const agencyId = Number(
      db
        .prepare(
          `INSERT INTO partner_agencies (
            company_name, trade_licence_no, rera_orn, vat_trn_15, bank_name, iban,
            tier, default_split_bps, verification_status, agreement_status, agreement_signed_at
          ) VALUES (
            'Harbour Crest Real Estate Broker LLC', 'DED-918273', '11842', '100991122300003',
            'Emirates NBD', 'AE190260001029384756101', 'GOLD', 3000, 'VERIFIED', 'SIGNED', '2026-02-10T10:00:00Z'
          )`,
        )
        .run().lastInsertRowid,
    );

    const insAgent = db.prepare(
      `INSERT INTO partner_agents (user_id, agency_id, rera_brn, brn_expiry_date, referral_code, is_agency_admin)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    insAgent.run(agencyOwnerUserId, agencyId, 'BRN-40010', '2027-08-31', 'harbour-owner', 1);
    const agent1Id = Number(insAgent.run(agent1UserId, agencyId, 'BRN-48219', '2027-06-30', 'karim-brn48219', 0).lastInsertRowid);
    const agent2Id = Number(insAgent.run(agent2UserId, agencyId, 'BRN-51904', '2027-09-15', 'elena-brn51904', 0).lastInsertRowid);

    // Seed Advisor Compensation Plan & Progressive Slabs + UAE Employees (including Emirati Nafis/GPSSA)
    const planId = Number(
      db
        .prepare(
          `INSERT INTO advisor_comp_plans (plan_name, self_gen_multiplier_bps, company_lead_multiplier_bps, progression_bonus_fils)
           VALUES ('Standard UAE Mortgage Advisor Plan', 12500, 10000, 150000)`,
        )
        .run().lastInsertRowid,
    );
    const insSlab = db.prepare(
      'INSERT INTO advisor_comp_slabs (plan_id, monthly_house_net_min_fils, monthly_house_net_max_fils, payout_bps) VALUES (?, ?, ?, ?)',
    );
    insSlab.run(planId, 0, 5_000_000, 2000); // 20% up to AED 50k House Net
    insSlab.run(planId, 5_000_000, 15_000_000, 3000); // 30% AED 50k - 150k
    insSlab.run(planId, 15_000_000, null, 4000); // 40% above AED 150k

    const insEmp = db.prepare(
      `INSERT INTO employees (
        user_id, emp_code, full_name, nationality_code, is_uae_national, nafis_registered, gpssa_number,
        mohre_person_id_14, routing_agent_id_9, employee_iban_23, contract_type, department, designation,
        comp_plan_id, join_date, basic_salary_fils, housing_allowance_fils, transport_allowance_fils,
        monthly_draw_fils, is_draw_recoverable, draw_deficit_fils, visa_expiry_date, emirates_id_expiry_date,
        rera_card_expiry_date, medical_ins_expiry_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MAINLAND_MOHRE', ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)`,
    );
    insEmp.run(
      advisorId, 'BW-EMP-001', 'Tariq Al Mansoori', 'AE', 1, 1, 'GPSSA-882910',
      '00192837465012', '302620122', 'AE070331234567890123456', 'Sales Advisory', 'Senior Mortgage Advisor',
      planId, '2022-03-01', 1_200_000, 600_000, 200_000, 500_000, '2099-12-31', '2029-10-15', '2027-04-30', '2027-03-31',
    );
    insEmp.run(
      headCreditId, 'BW-EMP-002', 'Layla Khoury', 'LB', 0, 0, '',
      '00283746591023', '302620122', 'AE210260001098765432109', 'Credit & Underwriting', 'Head of Credit',
      null, '2021-01-15', 1_800_000, 700_000, 300_000, 0, '2027-01-20', '2027-01-20', null, '2027-03-31',
    );
    insEmp.run(
      progId, 'BW-EMP-003', 'Nadia Al Zaabi', 'AE', 1, 1, 'GPSSA-994102',
      '00374829104857', '302620122', 'AE650440000012345678901', 'Conveyancing', 'Senior Progression Manager',
      planId, '2023-06-01', 1_100_000, 450_000, 150_000, 0, '2099-12-31', '2028-09-01', '2027-02-15', '2027-03-31',
    );

    // Seed 2 Households, Applicants, Leads, Deals & Conveyancing Cases so Chinese walls & all screens work out-of-the-box
    const hh1 = Number(
      db.prepare("INSERT INTO households (primary_name, segment) VALUES ('Khalid & Sara Al Nuaimi', 'RESIDENT_SALARIED')").run().lastInsertRowid,
    );
    const app1 = Number(
      db
        .prepare(
          `INSERT INTO applicants (
            household_id, user_id, applicant_role, full_name_en, full_name_ar, email, phone,
            nationality_code, residence_country, residency_type, dob, emirates_id, eid_expiry_date,
            passport_no, passport_expiry_date, employment_type, employer_name, employer_tier,
            basic_salary_fils, allowances_fils, bonus_annual_avg_fils, aecb_score
          ) VALUES (
            ?, ?, 'PRIMARY', 'Khalid Al Nuaimi', 'خالد النعيمي', 'client.khalid@example.ae', '+971503003001',
            'JO', 'AE', 'EXPAT_RESIDENT', '1987-04-12', '784-1987-4920184-1', '2028-05-20',
            'N8492011', '2030-09-14', 'SALARIED', 'Emirates Group', 'APPROVED_LISTED',
            3_000_000, 1_200_000, 6_000_000, 768
          )`,
        )
        .run(hh1, client1UserId).lastInsertRowid,
    );
    const app2 = Number(
      db
        .prepare(
          `INSERT INTO applicants (
            household_id, user_id, applicant_role, full_name_en, full_name_ar, email, phone,
            nationality_code, residence_country, residency_type, dob, emirates_id, eid_expiry_date,
            passport_no, passport_expiry_date, employment_type, employer_name, employer_tier,
            basic_salary_fils, allowances_fils, aecb_score
          ) VALUES (
            ?, ?, 'CO_BORROWER', 'Sara Al Nuaimi', 'سارة النعيمي', 'client.sara@example.ae', '+971503003002',
            'JO', 'AE', 'EXPAT_RESIDENT', '1990-08-22', '784-1990-9910284-2', '2028-05-20',
            'N8492099', '2030-09-14', 'SALARIED', 'Dubai Healthcare Authority', 'GOVERNMENT_GRE',
            1_800_000, 700_000, 782
          )`,
        )
        .run(hh1, client1SpouseUserId).lastInsertRowid,
    );

    db.prepare(
      `INSERT INTO applicant_liabilities (applicant_id, source, liability_type, lender_name, credit_limit_fils, outstanding_balance_fils, monthly_emi_fils)
       VALUES (?, 'AECB_VERIFIED', 'CREDIT_CARD', 'Emirates NBD Infinite', 8_000_000, 450_000, 0)`,
    ).run(app1);
    db.prepare(
      `INSERT INTO applicant_liabilities (applicant_id, source, liability_type, lender_name, credit_limit_fils, outstanding_balance_fils, monthly_emi_fils)
       VALUES (?, 'AECB_VERIFIED', 'AUTO_LOAN', 'ADCB Auto Finance', 0, 9_500_000, 245_000)`,
    ).run(app1);

    const hh2 = Number(
      db.prepare("INSERT INTO households (primary_name, segment) VALUES ('James Thornton', 'NON_RESIDENT')").run().lastInsertRowid,
    );
    db.prepare(
      `INSERT INTO applicants (
        household_id, user_id, applicant_role, full_name_en, email, phone,
        nationality_code, residence_country, residency_type, dob, passport_no, passport_expiry_date,
        employment_type, employer_name, employer_tier, currency_code, fx_rate_to_aed_bps, fx_haircut_bps,
        basic_salary_fils, allowances_fils, aecb_score
      ) VALUES (
        ?, ?, 'PRIMARY', 'James Thornton', 'client.james@example.co.uk', '+447700900123',
        'GB', 'GB', 'NON_RESIDENT', '1983-11-05', 'GBR99102481', '2031-04-10',
        'SALARIED', 'Barclays PLC London', 'MNC', 'GBP', 46500, 1500,
        1_200_000, 0, 795
      )`,
    ).run(hh2, client2UserId);

    const lead1 = Number(
      db
        .prepare(
          `INSERT INTO leads (
            household_id, contact_name, contact_phone, contact_email, source_channel,
            partner_agent_id, assigned_advisor_id, desk, transaction_type, target_property_fils,
            stage, first_response_due_at, first_responded_at, client_consent_logged_at
          ) VALUES (
            ?, 'Khalid Al Nuaimi', '+971503003001', 'client.khalid@example.ae', 'PARTNER_HUB',
            ?, ?, 'RESIDENT_DESK', 'READY_PURCHASE', 350_000_000,
            'CONVERTED_TO_DEAL', '2026-11-10T09:05:00Z', '2026-11-10T09:03:00Z', '2026-11-10T09:00:00Z'
          )`,
        )
        .run(hh1, agent1Id, advisorId).lastInsertRowid,
    );

    const lead2 = Number(
      db
        .prepare(
          `INSERT INTO leads (
            household_id, contact_name, contact_phone, contact_email, source_channel,
            partner_agent_id, assigned_advisor_id, desk, transaction_type, target_property_fils,
            stage, first_response_due_at, first_responded_at, client_consent_logged_at
          ) VALUES (
            ?, 'James Thornton', '+447700900123', 'client.james@example.co.uk', 'PARTNER_HUB',
            ?, ?, 'NON_RESIDENT_DESK', 'OFFPLAN_HANDOVER', 280_000_000,
            'CONVERTED_TO_DEAL', '2026-11-12T11:05:00Z', '2026-11-12T11:02:00Z', '2026-11-12T11:00:00Z'
          )`,
        )
        .run(hh2, agent2Id, advisorId).lastInsertRowid,
    );

    const deal1Id = Number(
      db
        .prepare(
          `INSERT INTO deals (
            deal_ref, origin_mode, lead_id, household_id, partner_agent_id, lead_source_category,
            advisor_id, underwriter_id, progression_manager_id, transaction_type, emirate,
            community_name, property_status, is_first_home, purchase_price_fils, estimated_valuation_fils,
            target_loan_fils, direct_client_fee_fils, tenure_months, pre_qual_cert_enabled,
            stage, cdd_status, selected_bank_id, selected_rate_card_id
          ) VALUES (
            'BW-2026-0001', 'LIVE', ?, ?, ?, 'COMPANY_OR_PARTNER',
            ?, ?, ?, 'READY_PURCHASE', 'dubai',
            'Dubai Hills Estate', 'READY', 1, 350_000_000, 350_000_000,
            280_000_000, 0, 300, 1,
            'VALUATION_RECEIVED', 'CLEARED', ?, ?
          )`,
        )
        .run(lead1, hh1, agent1Id, advisorId, headCreditId, progId, bankIdMap.get('hsbc')!, rateCardIdMap.get('hsbc')!).lastInsertRowid,
    );

    db.prepare(
      `INSERT INTO kfs_acknowledgements (deal_id, applicant_id, disclosed_broker_fee_fils, disclosed_lfi_commission_range, kfs_snapshot_json, signed_by_name)
       VALUES (?, ?, 0, '0.45% - 1.00% paid by LFI', '{}', 'Khalid Al Nuaimi')`,
    ).run(deal1Id, app1);
    db.prepare(
      `INSERT INTO kfs_acknowledgements (deal_id, applicant_id, disclosed_broker_fee_fils, disclosed_lfi_commission_range, kfs_snapshot_json, signed_by_name)
       VALUES (?, ?, 0, '0.45% - 1.00% paid by LFI', '{}', 'Sara Al Nuaimi')`,
    ).run(deal1Id, app2);

    db.prepare(
      `INSERT INTO conveyancing_cases (
        deal_id, form_f_signed_date, form_f_expiry_date, fol_contingency_date,
        deposit_cheque_no, deposit_cheque_fils, seller_has_mortgage, seller_bank_name,
        liability_letter_payoff_fils, liability_per_diem_fils, liability_letter_expires_at,
        deposit_paid_direct_fils, valuation_firm, valuation_amount_fils, noc_status, trustee_office
      ) VALUES (
        ?, '2026-11-05', '2026-12-20', '2026-11-26',
        'CHQ-884120', 35_000_000, 1, 'First Abu Dhabi Bank',
        142_000_000, 18_500, '2026-11-28',
        0, 'CBRE Dubai Valuation Panel', 350_000_000, 'APPLIED', 'Al Manara Real Estate Registration Trustee'
      )`,
    ).run(deal1Id);

    db.prepare(
      `INSERT INTO deals (
        deal_ref, origin_mode, lead_id, household_id, partner_agent_id, lead_source_category,
        advisor_id, underwriter_id, progression_manager_id, transaction_type, emirate,
        community_name, project_id, property_status, is_first_home, purchase_price_fils,
        estimated_valuation_fils, target_loan_fils, direct_client_fee_fils, tenure_months,
        stage, cdd_status, selected_bank_id, selected_rate_card_id
      ) VALUES (
        'BW-2026-0002', 'LIVE', ?, ?, ?, 'COMPANY_OR_PARTNER',
        ?, ?, ?, 'OFFPLAN_HANDOVER', 'dubai',
        'Dubai Marina', ?, 'HANDOVER_COMPLETION', 0, 280_000_000,
        295_000_000, 168_000_000, 1_000_000, 240,
        'DOC_COLLECTION', 'PENDING', ?, ?
      )`,
    ).run(lead2, hh2, agent2Id, advisorId, makerCreditId, progId, firstProjId, bankIdMap.get('emirates-nbd')!, rateCardIdMap.get('emirates-nbd')!);

    // Seed Internal Bank Policy Wiki Articles & Morning Standup Tasks
    const insWiki = db.prepare(
      `INSERT INTO wiki_articles (slug, category, bank_id, title_en, title_ar, body_en, body_ar, policy_version, clause_ref)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    insWiki.run(
      'cbuae-dbr-credit-card-limits',
      'CBUAE Credit Policy',
      bankIdMap.get('hsbc')!,
      'Credit Card Limit Assessment in 50% DBR (3% vs 5% Rule)',
      'احتساب حدود البطاقات الائتمانية ضمن سقف عبء الدين 50%',
      'Under CBUAE Mortgage Loan Regulations, total monthly debt service cannot exceed 50% of gross verified income. Standard UAE banks impute 5% of total granted credit card limits as a monthly obligation regardless of utilization; HSBC UAE, ADCB, and Dubai Islamic Bank impute 3% per internal retail credit policy.',
      'وفق ضوابط مصرف الإمارات المركزي لا يجوز أن تتجاوز الالتزامات الشهرية 50% من الدخل الإجمالي. تحتسب معظم البنوك 5% من إجمالي حدود البطاقات بينما تحتسب بعض البنوك مثل إتش إس بي سي وبنك أبوظبي التجاري وبنك دبي الإسلامي 3%.',
      'v2026.3',
      'CBUAE-MLR-Art4 / Retail-Credit-Sec3.2',
    );
    insWiki.run(
      'dld-form-f-valuation-clause',
      'RERA Conveyancing',
      null,
      'Mandatory Contract F Valuation & FOL Contingency Wording',
      'شرط حماية التقييم وخطاب العرض النهائي في عقد إف',
      'Always insert Special Condition 1 into Dubai REST Contract F before the buyer hands over the 10% security deposit cheque: the contract must be conditional on bank valuation meeting purchase price and written Final Offer Letter issuance within 21–28 calendar days.',
      'يجب إدراج الشرط الخاص الأول في عقد إف لحماية شيك التأمين بنسبة 10% في حال انخفاض التقييم العقاري أو عدم صدور خطاب العرض النهائي.',
      'v2026.1',
      'RERA-Conveyancing-Playbook-Ch2',
    );
    insWiki.run(
      'offplan-handover-apl-ltv',
      'Off-Plan Handover',
      bankIdMap.get('emirates-nbd')!,
      'Transition from 50% Under-Construction LTV to 80%/85% Handover LTV',
      'الانتقال من سقف 50% قيد الإنشاء إلى 80%/85% عند التسليم',
      'CBUAE caps under-construction financing at 50% LTV. Within 60–90 days of Building Completion Certificate (BCC) and handover notice, towers listed on a bank Approved Project List (APL) qualify for completed-property LTV limits (80% Expat first home, 85% UAE National first home up to AED 5M).',
      'يحدد المصرف المركزي تمويل العقارات قيد الإنشاء بنسبة 50%، ويرتفع السقف عند جاهزية التسليم للأبراج المدرجة في قائمة المشاريع المعتمدة.',
      'v2026.2',
      'CBUAE-MLR-Art3 / APL-Circular-09',
    );

    db.prepare(
      `INSERT INTO ops_tasks (deal_id, assigned_role, priority, title, due_at)
       VALUES (?, 'PROGRESSION_MANAGER', 'CRITICAL', 'Verify FAB Seller Liability Letter payoff & book Al Manara Trustee slot (BW-2026-0001)', '2026-11-24T14:00:00Z')`,
    ).run(deal1Id);
    db.prepare(
      `INSERT INTO ops_tasks (deal_id, assigned_role, priority, title, due_at)
       VALUES (?, 'COMPLIANCE_MLRO', 'HIGH', 'Review non-resident UK source-of-funds & KFS acknowledgement (BW-2026-0002)', '2026-11-18T17:00:00Z')`,
    ).run(deal1Id + 1);

    // Seed Opening Share Capital in GL so Cash & Equity balance cleanly
    const jeId = Number(
      db
        .prepare(
          `INSERT INTO gl_journal_entries (entry_ref, entry_date, memo, source_module, source_id, created_by)
           VALUES ('JE-2026-0001', '2026-01-01', 'Opening UAE Operating Capital — Betterway Mortgages LLC', 'SYSTEM_SEED', 'OPENING', ?)`,
        )
        .run(mdId).lastInsertRowid,
    );
    db.prepare('INSERT INTO gl_journal_lines (journal_entry_id, account_code, debit_fils, credit_fils, line_memo) VALUES (?, ?, ?, ?, ?)').run(
      jeId, '1100', 150_000_000, 0, 'Opening AED Bank Balance (AED 1,500,000.00)',
    );
    db.prepare('INSERT INTO gl_journal_lines (journal_entry_id, account_code, debit_fils, credit_fils, line_memo) VALUES (?, ?, ?, ?, ?)').run(
      jeId, '3100', 0, 150_000_000, 'Issued Share Capital & Retained Earnings',
    );

    // Seed 1 Confidential MLRO-Only goAML Investigation to prove Chinese-wall isolation in UI & tests
    db.prepare(
      `INSERT INTO goaml_reports (report_ref, report_type, deal_id, subject_summary, red_flag_indicators_json, goaml_xml_payload, status, created_by_mlro)
       VALUES (
         'GOAML-SAR-2026-001', 'SAR', NULL,
         'Declined walk-in inquiry proposing unverified third-party offshore cash deposit split across four personal accounts',
         '["UNVERIFIED_THIRD_PARTY_DEPOSIT","LAYERING_PATTERN"]',
         '<report><rentity_id>BW-MLRO</rentity_id><submission_code>E</submission_code><report_code>SAR</report_code></report>',
         'XML_READY', ?
       )`,
    ).run(mlroId);

    // Seed initial Manager Admin Decision, Daily Work Report, Attendance Log & DLD Market Transactions
    db.prepare(
      `INSERT INTO manager_admin_decisions (decision_ref, subject, category, reason, amount_fils, submitted_by_user_id, submitted_by_name, status)
       VALUES ('DEC-2026-001', 'Bayut & Dubizzle Co-Branded Mortgage Qualifier Campaign', 'Marketing & Portal Syndication', 'Target 50 high-intent ready-transfer buyers across Dubai Hills, Marina & Business Bay', 3500000, ?, 'Mohammad Haseeb', 'PENDING')`,
    ).run(haseebId);

    db.prepare(
      `INSERT INTO daily_work_reports (user_id, employee_name, report_date, calls_count, leads_qualified, site_visits_count, ipas_submitted, summary_notes, status)
       VALUES (?, 'Tariq Al Mansoori', '2026-11-16', 18, 5, 2, 2, 'Completed Dubai Hills valuation briefing for Khalid Al Nuaimi and packaged ENBD handover file for James Thornton.', 'SUBMITTED')`,
    ).run(advisorId);

    db.prepare(
      `INSERT INTO office_attendance_logs (user_id, employee_name, email, check_in_date, check_in_time_gst, shift_name, is_late, late_minutes, status)
       VALUES (?, 'Shabib Siraj', 'shabib@betterwaymortgages.com', '2026-11-16', '09:42', 'Mon–Fri 10:00–19:00', 0, 0, 'ON_TIME')`,
    ).run(shabibId);

    db.prepare(
      `INSERT INTO dld_market_transactions (tx_ref, tx_date, area_code, area_name, property_type, transaction_category, size_sqft, amount_fils, ppsf_aed, lender_bank)
       VALUES
         ('DLD-2026-99101', '2026-11-16', 'DHIL', 'Dubai Hills Estate', '4BR Golf Villa', 'Ready Mortgage', 4150, 991_850_000, 2390, 'HSBC UAE'),
         ('DLD-2026-99102', '2026-11-16', 'MARN', 'Dubai Marina', '2BR Waterfront Apt', 'Off-Plan Oqood', 1420, 325_180_000, 2290, 'Emirates NBD'),
         ('DLD-2026-99103', '2026-11-16', 'PALM', 'Palm Jumeirah', 'Signature Frond Villa', 'Ready Mortgage', 6800, 2_978_400_000, 4380, 'First Abu Dhabi Bank'),
         ('DLD-2026-99104', '2026-11-16', 'BBAY', 'Business Bay', '2BR Canal Residence', 'Refinance Buyout', 1310, 285_580_000, 2180, 'Dubai Islamic Bank')`,
    ).run();

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export const OFFICIAL_BETTERWAY_STAFF = OFFICIAL_STAFF_DIRECTORY;

/**
 * Ensures the live production database contains ONLY statutory reference master data
 * (Company Settings, UAE Chart of Accounts, 24 UAE Banks & Rate Cards, EIBOR, Developers/Projects,
 * and Official Betterway Mortgages LLC Staff) and clears all demo/seeded business transactions once.
 */
export function ensureCommercialProductionReady(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_flags (
      flag_key TEXT PRIMARY KEY,
      flag_value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Ensure base reference tables exist (if brand-new DB, seedInitialData first then strip demo rows)
  const existingCompany = db.prepare('SELECT COUNT(*) as c FROM company_settings').get() as { c: number };
  if (existingCompany.c === 0) {
    seedInitialData(db);
  }

  const resetDone = db
    .prepare("SELECT flag_value FROM system_flags WHERE flag_key = 'reset:commercial-production-v2'")
    .get() as { flag_value: string } | undefined;

  if (resetDone?.flag_value === '1') return;

  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('BEGIN IMMEDIATE');
  try {
    const transactionalTables = [
      'comm_messages',
      'leads',
      'deal_submissions',
      'conveyancing_cases',
      'vault_documents',
      'homeowner_radar_monitors',
      'cross_sell_referrals',
      'kfs_acknowledgements',
      'aml_screenings',
      'goaml_reports',
      'sanadak_complaints',
      'ops_tasks',
      'pdc_cheque_register',
      'real_estate_assets',
      'credit_risk_profiles',
      'loan_amortization_schedules',
      'clawback_ledger',
      'commission_settlements',
      'bank_bordereau_batches',
      'tax_invoices',
      'vendor_bills',
      'gl_journal_lines',
      'gl_journal_entries',
      'payroll_lines',
      'payroll_runs',
      'leave_records',
      'deals',
      'applicant_liabilities',
      'applicants',
      'households',
      'partner_agents',
      'partner_agencies',
      'daily_work_reports',
      'office_attendance_logs',
      'dld_market_transactions',
      'recycle_bin_requests',
      'manager_admin_decisions',
      'deal_withdrawals',
      'employees',
    ];

    for (const tbl of transactionalTables) {
      const exists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
        .get(tbl);
      if (exists) {
        db.exec(`DELETE FROM ${tbl};`);
      }
    }

    // Remove demo pending rate card
    db.prepare("DELETE FROM bank_rate_cards WHERE product_code = 'ENBD-5Y-CAMPAIGN'").run();

    // Reset sessions & users cleanly and insert Official Betterway Mortgages LLC Staff in canonical order
    db.exec('DELETE FROM sessions;');
    db.exec('DELETE FROM users;');

    const fallbackPass = process.env.STAFF_DEFAULT_PASSWORD || 'Betterway#2026';
    const ownerPassHash = hashPassword(process.env.OWNER_PASSWORD || fallbackPass);
    const adminPassHash = hashPassword(process.env.ADMIN_PASSWORD || fallbackPass);
    const staffPassHash = hashPassword(fallbackPass);
    const insertUser = db.prepare(`
      INSERT INTO users (email, phone, full_name_en, full_name_ar, password_hash, role, is_mlro, can_approve_rates, preferred_lang, status, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en', 'ACTIVE', ?)
    `);

    const planRow = db.prepare('SELECT id FROM advisor_comp_plans ORDER BY id ASC LIMIT 1').get() as { id: number } | undefined;
    const planId = planRow?.id ?? null;

    const insertEmployee = db.prepare(`
      INSERT INTO employees (
        user_id, emp_code, full_name, nationality_code, is_uae_national, nafis_registered, gpssa_number,
        mohre_person_id_14, routing_agent_id_9, employee_iban_23, contract_type, department, designation,
        comp_plan_id, join_date, basic_salary_fils, housing_allowance_fils, transport_allowance_fils,
        monthly_draw_fils, is_draw_recoverable, draw_deficit_fils, visa_expiry_date, emirates_id_expiry_date,
        rera_card_expiry_date, medical_ins_expiry_date, avatar_url
      ) VALUES (?, ?, ?, 'AE', ?, 0, '', ?, '302620122', ?, 'MAINLAND_MOHRE', ?, ?, ?, '2026-01-01', ?, 0, 0, 0, 1, 0, '2028-12-31', '2028-12-31', '2027-12-31', '2027-12-31', ?)
    `);

    OFFICIAL_BETTERWAY_STAFF.forEach((s, idx) => {
      const accountPassHash =
        s.email === 'shabib@betterwaymortgages.com' || s.email === 'warda@betterwaymortgages.com'
          ? ownerPassHash
          : s.email === 'admin@betterwaymortgages.com'
            ? adminPassHash
            : staffPassHash;
      const uRes = insertUser.run(
        s.email,
        s.phone,
        s.fullNameEn,
        s.fullNameAr,
        accountPassHash,
        s.role,
        s.isMlro,
        s.canApproveRates,
        s.avatarUrl,
      );
      const userId = Number(uRes.lastInsertRowid);
      insertEmployee.run(
        userId,
        s.empCode,
        s.fullNameEn,
        s.isNational,
        `0019283746500${idx + 1}`,
        `AE07033123456789012340${idx + 1}`,
        s.department,
        s.designation,
        planId,
        s.basicSalaryFils,
        s.avatarUrl,
      );
    });

    // Point active bank rate cards to Shabib Siraj so foreign keys remain valid
    const shabibUser = db.prepare("SELECT id FROM users WHERE email = 'shabib@betterwaymortgages.com'").get() as { id: number } | undefined;
    if (shabibUser) {
      db.prepare('UPDATE bank_rate_cards SET created_by = ?, approved_by = ?').run(shabibUser.id, shabibUser.id);
      db.prepare('UPDATE bank_project_apl SET updated_by = ?').run(shabibUser.id);
    }

    db.prepare(`
      INSERT INTO system_flags (flag_key, flag_value, updated_at)
      VALUES ('reset:commercial-production-v2', '1', datetime('now'))
      ON CONFLICT(flag_key) DO UPDATE SET flag_value = '1', updated_at = datetime('now')
    `).run();

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    db.exec('PRAGMA foreign_keys = ON;');
  }
}
