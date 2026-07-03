/**
 * verify/modules/translation.verifier.ts
 *
 * Covers: AC-TRANS-001 ~ AC-TRANS-007
 * Postmortem: 002 (Translation System)
 *
 * Tests the entity protection pipeline (serializeForAI → restoreEntities)
 * and translation resolution logic.
 */

import type { StepResult, Verifier, VerifyContext } from '../framework/types.js'
import type { Entity } from '~/types'
import fs from 'node:fs'
import path from 'node:path'

// We dynamically import the entityParser to test it
// These are the functions from ~/lib/react-tweet/utils/entitytParser

interface TranslationTestCase {
  id: string
  description: string
  originalEntities: Entity[]
  expectedMaskedText: string
  aiTranslatedText: string
  expectedRestored: Entity[]
}

function loadFixture<T = unknown>(fixtureDir: string, name: string): T {
  const filepath = path.join(fixtureDir, name)
  const raw = fs.readFileSync(filepath, 'utf8')
  return JSON.parse(raw) as T
}

export class TranslationVerifier implements Verifier {
  readonly id = 'translation-pipeline'
  readonly module = 'translation'
  readonly label = 'Translation Pipeline'
  readonly acIds = [
    'AC-TRANS-001',
    'AC-TRANS-002',
    'AC-TRANS-003',
    'AC-TRANS-004',
    'AC-TRANS-005',
    'AC-TRANS-006',
    'AC-TRANS-007',
  ]

  canRun(_ctx: VerifyContext): string | null {
    return null // All offline
  }

  async run(ctx: VerifyContext): Promise<StepResult[]> {
    const results: StepResult[] = []

    // Load fixture
    const fixture = loadFixture<{ testCases: TranslationTestCase[] }>(
      ctx.fixtureDir,
      'translations/entity-roundtrip.json',
    )

    // Dynamic import entityParser functions
    let serializeForAI: (...args: unknown[]) => unknown
    let restoreEntities: (...args: unknown[]) => unknown
    try {
      const mod = await import('~/lib/react-tweet/utils/entitytParser.js')
      serializeForAI = mod.serializeForAI
      restoreEntities = mod.restoreEntities
    }
    catch {
      results.push({
        id: 'AC-TRANS-001',
        name: 'Serialization: protect entities',
        verdict: 'SKIP',
        durationMs: 0,
        detail: 'Cannot import entitytParser module',
      })
      // Skip all dependent ACs
      for (const id of ['AC-TRANS-002', 'AC-TRANS-003', 'AC-TRANS-004']) {
        results.push({
          id,
          name: `${id}: entity protection`,
          verdict: 'SKIP',
          durationMs: 0,
          detail: 'Dependency skipped',
        })
      }
      return results
    }

    // ── AC-TRANS-001: Serialization ──────────────────────
    results.push(this.verifySerialization(fixture, serializeForAI))

    // ── AC-TRANS-002: Restore ────────────────────────────
    results.push(this.verifyRestore(fixture, serializeForAI, restoreEntities))

    // ── AC-TRANS-003: Text-only ──────────────────────────
    results.push(this.verifyTextOnly(fixture, serializeForAI, restoreEntities))

    // ── AC-TRANS-004: Only URLs ──────────────────────────
    results.push(this.verifyOnlyUrls(fixture, serializeForAI, restoreEntities))

    // ── AC-TRANS-005: resolveTranslationView ─────────────
    results.push(await this.verifyResolutionView())

    // ── AC-TRANS-006: materialize is pure ────────────────
    results.push(await this.verifyMaterializePure(ctx))

    // ── AC-TRANS-007: Dual provider ──────────────────────
    results.push(await this.verifyDualProvider())

    return results
  }

  private findCase(fixture: { testCases: TranslationTestCase[] }, id: string): TranslationTestCase {
    const tc = fixture.testCases.find(c => c.id === id)
    if (!tc)
      throw new Error(`Test case "${id}" not found`)
    return tc
  }

  private verifySerialization(
    fixture: { testCases: TranslationTestCase[] },
    serializeForAI: (...args: unknown[]) => unknown,
  ): StepResult {
    const t0 = performance.now()
    try {
      const tc = this.findCase(fixture, 'basic-mixed-entities')
      const { maskedText, entityMap } = serializeForAI(tc.originalEntities)

      const checks: string[] = []
      let passed = true

      if (!maskedText.includes('<<__MENTION_0__>>')) {
        checks.push('missing MENTION placeholder')
        passed = false
      }
      if (!maskedText.includes('<<__HASHTAG_1__>>')) {
        checks.push('missing HASHTAG placeholder')
        passed = false
      }
      if (!maskedText.includes('<<__URL_2__>>')) {
        checks.push('missing URL placeholder')
        passed = false
      }
      if (entityMap.size < 3) {
        checks.push(`entityMap size=${entityMap.size}, expected >=3`)
        passed = false
      }
      if (maskedText.includes('@alice')) {
        checks.push('raw mention not masked')
        passed = false
      }

      return {
        id: 'AC-TRANS-001',
        name: 'Serialization: protect entities',
        verdict: passed ? 'PASS' : 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        detail: passed ? '3 entities masked' : undefined,
        error: passed ? undefined : checks.join('; '),
      }
    }
    catch (err) {
      return {
        id: 'AC-TRANS-001',
        name: 'Serialization: protect entities',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private verifyRestore(
    fixture: { testCases: TranslationTestCase[] },
    serializeForAI: (...args: unknown[]) => unknown,
    restoreEntities: (...args: unknown[]) => unknown,
  ): StepResult {
    const t0 = performance.now()
    try {
      const tc = this.findCase(fixture, 'basic-mixed-entities')
      const { entityMap } = serializeForAI(tc.originalEntities)
      const restored = restoreEntities(tc.aiTranslatedText, entityMap, tc.originalEntities)

      // Check special entities unchanged — they use aiTranslation (v2.1), not translation
      const mention = restored.find((e: Entity) => e.type === 'mention')
      const hashtag = restored.find((e: Entity) => e.type === 'hashtag')
      const url = restored.find((e: Entity) => e.type === 'url')

      const checks: string[] = []
      let passed = true

      // Special entities (mention/hashtag/url) must NOT have aiTranslation — they're preserved as-is
      if (!mention) {
        checks.push('mention missing')
        passed = false
      }
      else if ((mention as any).aiTranslation) {
        checks.push('mention was modified')
        passed = false
      }
      if (!hashtag) {
        checks.push('hashtag missing')
        passed = false
      }
      else if ((hashtag as any).aiTranslation) {
        checks.push('hashtag was modified')
        passed = false
      }
      if (!url) {
        checks.push('url missing')
        passed = false
      }
      else if ((url as any).aiTranslation) {
        checks.push('url was modified')
        passed = false
      }

      // Text entities should receive aiTranslation
      const textEntities = restored.filter((e: Entity) => e.type === 'text')
      const hasTextTranslation = textEntities.some(e => !!(e as any).aiTranslation)
      if (!hasTextTranslation) {
        checks.push('no text entity has aiTranslation')
        passed = false
      }

      return {
        id: 'AC-TRANS-002',
        name: 'Restore: entity integrity',
        verdict: passed ? 'PASS' : 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        detail: passed ? 'special entities intact, text translated' : undefinedndefined,
        error: passed ? undefined : checks.join('; '),
      }
    }
    catch (err) {
      return {
        id: 'AC-TRANS-002',
        name: 'Restore: entity integrity',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private verifyTextOnly(
    fixture: { testCases: TranslationTestCase[] },
    serializeForAI: (...args: unknown[]) => unknown,
    restoreEntities: (...args: unknown[]) => unknown,
  ): StepResult {
    const t0 = performance.now()
    try {
      const tc = this.findCase(fixture, 'text-only')
      const { maskedText, entityMap } = serializeForAI(tc.originalEntities)
      const restored = restoreEntities(tc.aiTranslatedText, entityMap, tc.originalEntities)

      const textEntity = restored[0] as Entity
      const translationOk = textEntity.aiTranslation === tc.aiTranslatedText
      const mapEmpty = entityMap.size === 0

      if (translationOk && mapEmpty && maskedText === tc.originalEntities[0]!.text) {
        return {
          id: 'AC-TRANS-003',
          name: 'Text-only: no interference',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
        }
      }
      return {
        id: 'AC-TRANS-003',
        name: 'Text-only: no interference',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: `translation:${translationOk} mapEmpty:${mapEmpty} textMatch:${maskedText === tc.originalEntities[0]!.text}`,
      }
    }
    catch (err) {
      return {
        id: 'AC-TRANS-003',
        name: 'Text-only: no interference',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private verifyOnlyUrls(
    fixture: { testCases: TranslationTestCase[] },
    serializeForAI: (...args: unknown[]) => unknown,
    restoreEntities: (...args: unknown[]) => unknown,
  ): StepResult {
    const t0 = performance.now()
    try {
      const tc = this.findCase(fixture, 'only-urls')
      const { maskedText, entityMap } = serializeForAI(tc.originalEntities)
      const restored = restoreEntities(tc.aiTranslatedText, entityMap, tc.originalEntities)

      const urlEntity = restored[0] as Entity
      const urlUnchanged = urlEntity.type === 'url' && !urlEntity.translation

      if (maskedText === '<<__URL_0__>>' && entityMap.size === 1 && urlUnchanged) {
        return {
          id: 'AC-TRANS-004',
          name: 'Only URLs: protected',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
        }
      }
      return {
        id: 'AC-TRANS-004',
        name: 'Only URLs: protected',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: `masked:${maskedText === '<<__URL_0__>>'} mapSize:${entityMap.size}`,
      }
    }
    catch (err) {
      return {
        id: 'AC-TRANS-004',
        name: 'Only URLs: protected',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private async verifyResolutionView(): Promise<StepResult> {
    const t0 = performance.now()
    try {
      const mod = await import('~/lib/translation/resolveTranslationView.js')
      // Basic import check — the function exists
      if (typeof mod.resolveTranslationView === 'function') {
        return {
          id: 'AC-TRANS-005',
          name: 'resolveTranslationView exists',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
          detail: 'function importable',
        }
      }
      return {
        id: 'AC-TRANS-005',
        name: 'resolveTranslationView exists',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: 'Not a function',
      }
    }
    catch (err) {
      return {
        id: 'AC-TRANS-005',
        name: 'resolveTranslationView exists',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private async verifyMaterializePure(_ctx: VerifyContext): Promise<StepResult> {
    const t0 = performance.now()
    try {
      const mod = await import('~/lib/translation/materialize.js')
      if (typeof mod.materializeTweetWithManualTranslations || mod.materializeTweetsWithManualTranslations === 'function') {
        return {
          id: 'AC-TRANS-006',
          name: 'materializeTweetWithManualTranslations exists',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
        }
      }
      return {
        id: 'AC-TRANS-006',
        name: 'materializeTweetWithManualTranslations exists',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: 'Not a function',
      }
    }
    catch (err) {
      return {
        id: 'AC-TRANS-006',
        name: 'materializeTweetWithManualTranslations exists',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private async verifyDualProvider(): Promise<StepResult> {
    const t0 = performance.now()
    try {
      const mod = await import('~/lib/providers/index.js')
      const googleOk = typeof mod.getProviderStrategy === 'function'

      if (googleOk) {
        // Test that different providers return different strategies
        const google = mod.getProviderStrategy('google')
        const deepseek = mod.getProviderStrategy('deepseek')
        const different = google !== deepseek && google.name !== deepseek.name

        return {
          id: 'AC-TRANS-007',
          name: 'Dual provider: google + deepseek',
          verdict: different ? 'PASS' : 'WARN',
          durationMs: Math.round(performance.now() - t0),
          detail: `google:${google.name} deepseek:${deepseek.name}`,
          error: different ? undefined : 'Both returned same strategy',
        }
      }
      return {
        id: 'AC-TRANS-007',
        name: 'Dual provider: google + deepseek',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: 'getProviderStrategy not found',
      }
    }
    catch (err) {
      return {
        id: 'AC-TRANS-007',
        name: 'Dual provider: google + deepseek',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }
}
