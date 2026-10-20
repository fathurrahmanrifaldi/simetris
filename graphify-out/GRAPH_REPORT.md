# Graph Report - SIMETRIS  (2026-10-20)

## Corpus Check
- 157 files · ~262,289 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 56 file(s) not represented in the graph (top: .csv 53, .css 2, (none) 1)

## Summary
- 1441 nodes · 2631 edges · 73 communities (47 shown, 26 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 116 edges (avg confidence: 0.86)
- Token cost: 1,200 input · 450 output

## Community Hubs (Navigation)
- Testing & Verification
- UI Components & Views
- Community 2 Module
- SIMETRIS Core Inventory
- SIMETRIS Core Inventory
- Community 5 Module
- Community 6 Module
- Community 7 Module
- Community 8 Module
- Search & Intelligence Scripts
- UI Components & Views
- SIMETRIS Core Inventory
- UI Components & Views
- Community 13 Module
- Community 14 Module
- Community 15 Module
- Community 16 Module
- Testing & Verification
- Design Tokens & Colors
- Community 19 Module
- Design Tokens & Colors
- Testing & Verification
- Community 22 Module
- Community 23 Module
- Community 24 Module
- Community 25 Module
- Design Tokens & Colors
- Testing & Verification
- SIMETRIS Core Inventory
- Iconography & Assets
- Community 32 Module
- Design Tokens & Colors
- Auth & Access Control
- Testing & Verification
- Testing & Verification
- Design Tokens & Colors
- SIMETRIS Core Inventory
- Testing & Verification
- Testing & Verification
- Community 41 Module
- Community 42 Module
- Testing & Verification
- Design Tokens & Colors
- Community 45 Module
- Community 46 Module
- Typography & Styling
- Design Tokens & Colors
- Design Tokens & Colors
- Community 50 Module
- SIMETRIS Core Inventory
- Design Tokens & Colors
- Community 54 Module
- Testing & Verification
- Search & Intelligence Scripts
- Testing & Verification
- Community 59 Module
- Testing & Verification
- SIMETRIS Core Inventory
- UI Components & Views
- Community 64 Module
- Testing & Verification
- Testing & Verification
- Community 67 Module
- Community 68 Module
- Community 69 Module
- Testing & Verification
- Community 72 Module

## God Nodes (most connected - your core abstractions)
1. `TailwindConfigGenerator` - 58 edges
2. `SimetrisStore` - 55 edges
3. `TestTailwindConfigGenerator` - 35 edges
4. `DesignSystemGenerator` - 35 edges
5. `ShadcnInstaller` - 34 edges
6. `TestShadcnInstaller` - 26 edges
7. `compilerOptions` - 18 edges
8. `read_rows()` - 16 edges
9. `color` - 15 edges
10. `search()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `TestGeneratedConfigIsValidJs` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .agents/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestTailwindConfigGenerator` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .agents/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestReasoningContract` --uses--> `DesignSystemGenerator`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_data_contracts.py → .agents/skills/ui-ux-pro-max/scripts/design_system.py
- `TestEndToEndCoherence` --uses--> `DesignSystemGenerator`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_design_system_mode.py → .agents/skills/ui-ux-pro-max/scripts/design_system.py
- `TestShadcnInstaller` --uses--> `ShadcnInstaller`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_shadcn_add.py → .agents/skills/ui-styling/scripts/shadcn_add.py

## Import Cycles
- None detected.

## Communities (73 total, 26 thin omitted)

### Community 0 - "Testing & Verification"
Cohesion: 0.06
Nodes (44): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, TestGeneratedCatalogContract, _catalog_date(), _check_app_interface_contract() (+36 more)

### Community 1 - "UI Components & Views"
Cohesion: 0.05
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 2 - "Community 2 Module"
Cohesion: 0.06
Nodes (31): BM25, _contains_phrase(), detect_domain(), _domain_keywords(), _exact_match_diagnostic(), _exact_row_identity(), _exact_stack_identifier(), _file_signature() (+23 more)

### Community 3 - "SIMETRIS Core Inventory"
Cohesion: 0.06
Nodes (25): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+17 more)

### Community 4 - "SIMETRIS Core Inventory"
Cohesion: 0.06
Nodes (40): AppStoreData, DEFAULT_AUDIT_LOGS, DEFAULT_BATCHES, DEFAULT_BUSINESS, DEFAULT_CATEGORIES, DEFAULT_MEMBERS, DEFAULT_MOVEMENTS, DEFAULT_PRODUCTS (+32 more)

### Community 5 - "Community 5 Module"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 6 - "Community 6 Module"
Cohesion: 0.04
Nodes (48): $type, $value, background, destructive, destructive-foreground, foreground, muted, muted-foreground (+40 more)

### Community 7 - "Community 7 Module"
Cohesion: 0.06
Nodes (13): BM25, detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv(), BM25 (+5 more)

### Community 8 - "Community 8 Module"
Cohesion: 0.06
Nodes (45): $type, $value, $type, $value, bg, fg, font-size, hover-bg (+37 more)

### Community 9 - "Search & Intelligence Scripts"
Cohesion: 0.08
Nodes (17): format_context(), format_result(), main(), BM25, calculate_pattern_break(), detect_domain(), get_background_config(), get_color_for_emotion() (+9 more)

### Community 10 - "UI Components & Views"
Cohesion: 0.15
Nodes (27): lucide-react, react, App(), Modal(), ModalProps, Navbar(), NavbarProps, Sidebar() (+19 more)

### Community 12 - "UI Components & Views"
Cohesion: 0.06
Nodes (35): dependencies, lucide-react, react, react-dom, @supabase/supabase-js, devDependencies, oxlint, tailwindcss (+27 more)

### Community 13 - "Community 13 Module"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 14 - "Community 14 Module"
Cohesion: 0.10
Nodes (11): build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image(), main(), format_brief() (+3 more)

### Community 15 - "Community 15 Module"
Cohesion: 0.09
Nodes (11): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_master_md(), format_page_override_md(), _generate_intelligent_overrides(), hex_to_ansi(), persist_design_system() (+3 more)

### Community 16 - "Community 16 Module"
Cohesion: 0.13
Nodes (3): DesignSystemGenerator, _resolve_dial(), TestReasoningMatch

### Community 18 - "Design Tokens & Colors"
Cohesion: 0.17
Nodes (4): test_sync_parses_bundled_starter_template(), _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation()

### Community 19 - "Community 19 Module"
Cohesion: 0.13
Nodes (10): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+2 more)

### Community 20 - "Design Tokens & Colors"
Cohesion: 0.11
Nodes (5): _query_wants_dark(), _resolve_color_mode(), _style_is_dark_primary(), TestModeResolution, TestStyleTaxonomy

### Community 22 - "Community 22 Module"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 23 - "Community 23 Module"
Cohesion: 0.16
Nodes (9): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+1 more)

### Community 24 - "Community 24 Module"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 25 - "Community 25 Module"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 28 - "Design Tokens & Colors"
Cohesion: 0.20
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 29 - "Testing & Verification"
Cohesion: 0.15
Nodes (4): format_markdown(), generate_design_system(), TestDiagnosticsContracts, TestPersistence

### Community 30 - "SIMETRIS Core Inventory"
Cohesion: 0.18
Nodes (4): _palette_is_dark(), _relative_luminance(), TestEndToEndCoherence, TestLuminance

### Community 32 - "Community 32 Module"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 34 - "Auth & Access Control"
Cohesion: 0.20
Nodes (4): apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), _validate_action()

### Community 35 - "Testing & Verification"
Cohesion: 0.20
Nodes (3): read_rows(), TestLandingAndStackContract, TestReasoningContract

### Community 38 - "SIMETRIS Core Inventory"
Cohesion: 0.22
Nodes (4): _contrast_ratio(), _derive_dark_palette(), _select_palette_for_mode(), TestPaletteSelection

### Community 41 - "Community 41 Module"
Cohesion: 0.17
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 42 - "Community 42 Module"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 43 - "Testing & Verification"
Cohesion: 0.18
Nodes (3): read_rows(), TestTextLayoutDataContracts, TestTextLayoutRetrieval

### Community 44 - "Design Tokens & Colors"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 45 - "Community 45 Module"
Cohesion: 0.25
Nodes (4): generate_html(), get_deliverable_info(), get_image_base64(), main()

### Community 46 - "Community 46 Module"
Cohesion: 0.18
Nodes (11): fast, normal, slow, $type, $value, $type, $value, primitive (+3 more)

### Community 49 - "Design Tokens & Colors"
Cohesion: 0.29
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 50 - "Community 50 Module"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 52 - "SIMETRIS Core Inventory"
Cohesion: 0.28
Nodes (9): Database Schema & ERD (SIMETRIS), Logika FEFO (First Expired, First Out), Pengadaan & Purchase Order, Buku Besar Mutasi Stok, Stock Opname & Koreksi, Product Requirements Document (SIMETRIS), Peran: Owner, Peran: Staff (+1 more)

### Community 54 - "Community 54 Module"
Cohesion: 0.29
Nodes (8): $type, $value, $type, $value, radius, default, full, default

### Community 59 - "Community 59 Module"
Cohesion: 0.47
Nodes (6): sm, shadow, sm, sm, $type, $value

### Community 62 - "SIMETRIS Core Inventory"
Cohesion: 0.47
Nodes (3): split_values(), style_identities(), TestStyleIdentityContract

### Community 63 - "UI Components & Views"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 64 - "Community 64 Module"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 67 - "Community 67 Module"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 68 - "Community 68 Module"
Cohesion: 0.67
Nodes (4): $type, $value, md, md

### Community 69 - "Community 69 Module"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

## Knowledge Gaps
- **8 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `oxlint`, `tailwindcss` (+3 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 606 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TailwindConfigGenerator` connect `Design Tokens & Colors` to `Design Tokens & Colors`, `Community 14 Module`, `Typography & Styling`, `Testing & Verification`, `Design Tokens & Colors`, `Community 51 Module`, `Testing & Verification`, `Community 26 Module`, `Design Tokens & Colors`, `Testing & Verification`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testing & Verification` be split into smaller, more focused modules?**
  _Cohesion score 0.06025039123630673 - nodes in this community are weakly interconnected._
- **Why does `ShadcnInstaller` connect `UI Components & Views` to `Design Tokens & Colors`, `Community 14 Module`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `DesignSystemGenerator` (e.g. with `TestReasoningMatch` and `TestReasoningContract`) actually correct?**
  _`DesignSystemGenerator` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `UI Components & Views` be split into smaller, more focused modules?**
  _Cohesion score 0.053555750658472345 - nodes in this community are weakly interconnected._