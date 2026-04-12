import { describe, it, expect, vi } from 'vitest';
import { FluentUtils } from './utils.js';
import * as fs from 'fs';
import dedent from 'dedent';

// ─── Fixtures ───────────────────────────────

const ymlContent = `
- type: entity
  abstract: true
  parent: TestParent1
  id: TestId1
  components:
  - type: Action
    startDelay: true
    useDelay: 10
    icon:
      sprite: Mobs/Ghosts/ghost_human.rsi
      state: icon
  - type: InstantAction
    event: !type:CritSuccumbEvent

- type: entity
  parent: TestParent2
  id: TestId2
  name: test name
  description: test desc
  suffix: test suffix
  components:
  - type: Action
    startDelay: true
    useDelay: 10
    icon:
      sprite: Mobs/Ghosts/ghost_human.rsi
      state: icon
  - type: InstantAction
    event: !type:CritSuccumbEvent

- type: entity
  parent: TestParent3
  id: TestId3
  name: test name
  description: test desc
  suffix: test suffix

- type: entity
  parent: TestParent4
  id: TestId4
  description: test desc
  suffix: test suffix

- type: entity
  parent: TestParent5
  id: TestId5
  name: test name
  suffix: test suffix

- type: entity
  parent: TestParent6
  id: TestId6
  name: test name
  description: test desc
  
- type: entity
  id: TestId7
`;

// ─── Tests ───────────────────────────────
vi.mock('fs');

describe('FluentUtils', () => {
    describe('readYmlEntity', () => {
        it('returns an array from an entity object file contains entity', () => {
            vi.mocked(fs.readFileSync).mockReturnValue(ymlContent);

            const result = FluentUtils.readYmlEntity('/dir', 'file.yml');

            const expected = [
                {
                    parent: 'TestParent1',
                    id: 'TestId1',
                    name: undefined,
                    description: undefined,
                    suffix: undefined
                },
                {
                    parent: 'TestParent2',
                    id: 'TestId2',
                    name: 'test name',
                    description: 'test desc',
                    suffix: 'test suffix'
                },
                {
                    parent: 'TestParent3',
                    id: 'TestId3',
                    name: 'test name',
                    description: 'test desc',
                    suffix: 'test suffix'
                },
                {
                    parent: 'TestParent4',
                    id: 'TestId4',
                    name: undefined,
                    description: 'test desc',
                    suffix: 'test suffix'
                },
                {
                    parent: 'TestParent5',
                    id: 'TestId5',
                    name: 'test name',
                    description: undefined,
                    suffix: 'test suffix'
                },
                {
                    parent: 'TestParent6',
                    id: 'TestId6',
                    name: 'test name',
                    description: 'test desc',
                    suffix: undefined
                },
                {
                    parent: undefined,
                    id: 'TestId7',
                    name: undefined,
                    description: undefined,
                    suffix: undefined
                },
            ];

            expect(result).toEqual(expected);
        });

        it('converts array of entities to fluent-formatted string', () => {
            const ymlTrashContent = dedent`
                - type: accessLevel
                  id: Trash1
                  name: id-card-access-level-quartermaster
                
                - type: accent
                  id: Trash2
                  fullReplacements:
                  - trash-1
                  - trash-2
            `;

            vi.mocked(fs.readFileSync).mockReturnValue(ymlTrashContent);

            const result = FluentUtils.readYmlEntity('/dir', 'file.yml');

            expect(result).toBeNull();
        });
    });

    describe('parseYml', () => {
        it('returns the expanded text from the array of entities', () => {
            vi.mocked(fs.readFileSync).mockReturnValue(ymlContent);

            const rawContent = FluentUtils.readYmlEntity('/dir', 'file.yml');
            const result = rawContent !== null
                ? FluentUtils.parseYml(rawContent)
                : '';

            const expected = dedent`
                ent-TestId1 = { ent-TestParent1 }
                    .desc = { ent-TestParent1.desc }
                
                ent-TestId2 = test name
                    .desc = test desc
                    .suffix = test suffix
                
                ent-TestId3 = test name
                    .desc = test desc
                    .suffix = test suffix
                
                ent-TestId4 = { ent-TestParent4 }
                    .desc = test desc
                    .suffix = test suffix
                
                ent-TestId5 = test name
                    .desc = { ent-TestParent5.desc }
                    .suffix = test suffix
                
                ent-TestId6 = test name
                    .desc = test desc

                ent-TestId7 = { "" }
                    .desc = { "" }
            `;

            expect(result).toEqual(expected);
        });
    });

    describe('getUpdatedContent', () => {
        it('wraps changed fluent keys with AUTOGEN comment block containing old value', () => {
            const oldContent = dedent`
            test-number-zero = Will be deleted
            
            test-number-one = { "" }
            
            test-number-two = Test text!
            
            test-number-three =
                Test:
                {$test}
            
            test-number-four = {CAPITALIZE(THE($entity))} test text!
            
            test-number-five = [color=lightslategray]{CAPITALIZE(SUBJECT($target))} {CONJUGATE-BASIC($target, "shimmer", "shimmers")} with strange transparency.[/color]
            
            test-number-six = - [color=yellow]{$type}[/color] test text [color=lightblue]{$value}[/color].
            
            test-number-seven =
                Below is a quick reference guide to several atmospheric devices:
            
                            Passive Vents:
                            These vents don't require power, they allow gases to flow freely both into and out of the pipe network they are attached to.
            
                            Active Vents:
                            These are the most common vents on the station. They have an internal pump, and require power. By default, they will only pump gases out of pipes, and only up to 101 kpa. However, they can be reconfigured using an air alarm. They will also lock out if the room is under 1 kpa, to prevent pumping gasses into space.
            
                            Air Scrubbers:
                            These devices allow gases to be removed from the environment and put into the connected pipe network. They can be configured to select specific gases when connected to an air alarm.
            
                            Air Injectors:
                            Injectors are similar to active vents, but they have no internal pump and do not require power. They cannot be configured, but they can continue to pump gasses up to much higher pressures.
            
            test-number-eight =   Send reinforcements!
                .desc =         An official notice from... an alternate timeline?
                .content =
                                {"[head=2]This is an official notice from the [color=red]Chief Security Officer[/color] at a Nanotrasen's Space Station 15.[/head]"}
            
                                To whoever receives this letter. I am Sergeant Rigel. My occupation is the CSO. We need immediate assistance.
            
                                Our station is currently under attack by Atomic Agents, this letter is being thrown into a destabilized bluespace anomaly created by our [color=purple]Head of Research[/color].
            
                                I am currently bolted in the Bridge, if you receive this message, please send aid immediately. I don't know how much longer we can last.
            
                                Glory to Nanotrasen.
            
            test-number-nine = The bolts are {$down ->
            [true] [color=red]down[/color]
            *[false] [color=green]up[/color]
            }.
            
            test-number-ten = { TOSTRING($divided, "F1") } { $places ->
                [0] Wh
                [1] kWh
                [2] MWh
                [3] GWh
                [4] TWh
                *[5] ???
            }
            
            test-number-eleven = { $amount ->
                [1] {NATURALFIXED($amount, 2)} {$unit} of {$material} ([color=red]{NATURALFIXED($missingAmount, 2)} {$unit} missing[/color])
                *[other] {NATURALFIXED($amount, 2)} {MAKEPLURAL($unit)} of {$material} ([color=red]{NATURALFIXED($missingAmount, 2)} {MAKEPLURAL($unit)} missing[/color])
            }
            
            test-number-twelve = Will be deleted
            
            test-number-fifteen = Will be deleted 2
            
            test-number-sixteen = Will be deleted 3
            
            test-number-seventeen = Name
            `;

            const newContent = dedent`
            # Test comment
            test-number-one = { "" }
            
            # Test comments
            # Test comments
            test-number-two = NEW test text!

            test-number-three =
                NEW test:
                {$test}
            
            test-number-four = {CAPITALIZE(THE($entity))} test text! NEW
            
            test-number-five = NEW [color=lightslategray]{CAPITALIZE(SUBJECT($target))} {CONJUGATE-BASIC($target, "shimmer", "shimmers")} with strange transparency.[/color]
            
            test-number-six = - [color=yellow]{$type}[/color] NEW test text [color=lightblue]{$value}[/color].
            
            test-number-seven =
                Below is a quick reference guide to several atmospheric devices:
            
                            Passive Vents:
                            These vents don't require power, they allow gases to flow freely both into and out of the pipe network they are attached to.
            
                            Active Vents:
                            These are the most common vents on the station. They have an internal pump, and require power. By default, they will only pump gases out of pipes, and only up to 101 kpa. However, they can be reconfigured using an air alarm. They will also lock out if the room is under 1 kpa, to prevent pumping gasses into space.
            
                            Air Scrubbers:
                            These devices allow gases to be removed from the environment and put into the connected pipe network. They can be configured to select specific gases when connected to an air alarm.
            
                            Air Injectors:
                            Injectors are similar to active vents, but they have no internal pump and do not require power. They cannot be configured, but they can continue to pump gasses up to much higher pressures. NEW
            
            test-number-eight =   Send reinforcements! NEW
                .desc =         An official notice from... an alternate timeline? NEW
                .content =
                                {"[head=2]This is an official notice from the [color=red]Chief Security Officer[/color] at a Nanotrasen's Space Station 15.[/head]"}
            
                                To whoever receives NEW!!! this letter. I am Sergeant Rigel. My occupation is the CSO. We need immediate assistance.
            
                                Our station is currently under attack by Atomic Agents, this letter is being thrown into a destabilized bluespace anomaly created by our [color=purple]Head of Research[/color].
            
                                I am currently bolted in the Bridge, if you receive this message, please send aid immediately. I don't know how much longer we can last.
            
                                NEW Glory to Nanotrasen.
            
            test-number-nine = NEW the bolts are {$down ->
            [true] [color=red]NEW down[/color]
            *[false] [color=green]up[/color]
            }.
            
            test-number-ten = { TOSTRING($divided, "F1") } { $places ->
                [0] Wh
                [1] kWh
                [2] MWh
                [3] GWh
                [4] NEW
                *[5] ???
            }
            
            test-number-eleven = { $amount ->
                [1] {NATURALFIXED($amount, 2)} {$unit} of {$material} ([color=red]{NATURALFIXED($missingAmount, 2)} {$unit} missing[/color]) NEW
                *[other] {NATURALFIXED($amount, 2)} {MAKEPLURAL($unit)} of {$material} ([color=red]{NATURALFIXED($missingAmount, 2)} {MAKEPLURAL($unit)} missing[/color])
            }
            
            test-number-thirteen = Will be added
            
            test-number-seventeen = Name
            `;

            const target = dedent`
            test-number-zero = Will be deleted
            
            test-number-one = { "" }
            
            test-number-two = Test text!
            
            test-number-three =
                Test:
                {$test}
            
            test-number-four = {CAPITALIZE(THE($entity))} test text!
            
            test-number-five = [color=lightslategray]{CAPITALIZE(SUBJECT($target))} {CONJUGATE-BASIC($target, "shimmer", "shimmers")} with strange transparency.[/color]
            
            test-number-six = - [color=yellow]{$type}[/color] тест текст [color=lightblue]{$value}[/color].
            
            test-number-seven =
                Тест Below is a quick reference guide to several atmospheric devices:
            
                            Passive Vents:
                            These vents don't require power, they allow gases to flow freely both into and out of the pipe network they are attached to.
            
                            Active Vents:
                            These are the most common vents on the station. They have an internal pump, and require power. By default, they will only pump gases out of pipes, and only up to 101 kpa. However, they can be reconfigured using an air alarm. They will also lock out if the room is under 1 kpa, to prevent pumping gasses into space.
            
                            Air Scrubbers:
                            These devices allow gases to be removed from the environment and put into the connected pipe network. They can be configured to select specific gases when connected to an air alarm.
            
                            Air Injectors:
                            Injectors are similar to active vents, but they have no internal pump and do not require power. They cannot be configured, but they can continue to pump gasses up to much higher pressures.
            
            test-number-eight =   Тест Send reinforcements!
                .desc =         Тест An official notice from... an alternate timeline?
                .content =
                                Тест {"[head=2]This is an official notice from the [color=red]Chief Security Officer[/color] at a Nanotrasen's Space Station 15.[/head]"}
            
                                To whoever receives this letter. I am Sergeant Rigel. My occupation is the CSO. We need immediate assistance.
            
                                Our station is currently under attack by Atomic Agents, this letter is being thrown into a destabilized bluespace anomaly created by our [color=purple]Head of Research[/color].
            
                                I am currently bolted in the Bridge, if you receive this message, please send aid immediately. I don't know how much longer we can last.
            
                                Glory to Nanotrasen.
            
            test-number-nine = Тест The bolts are {$down ->
            [true] [color=red]down[/color]
            *[false] [color=green]up[/color]
            }.
            
            test-number-ten = { TOSTRING($divided, "F1") } { $places ->
                [0] Wh Тест
                [1] kWh
                [2] MWh
                [3] GWh
                [4] TWh
                *[5] ???
            }
            
            test-number-eleven = { $amount ->
                [1] {NATURALFIXED($amount, 2)} {$unit} of {$material} ([color=red]{NATURALFIXED($missingAmount, 2)} {$unit} missing[/color])
                *[other] {NATURALFIXED($amount, 2)} {MAKEPLURAL($unit)} of {$material} ([color=red]{NATURALFIXED($missingAmount, 2)} {MAKEPLURAL($unit)} missing[/color])
            }
            
            test-number-twelve = Будет удалено
            
            test-number-fifteen = Will be deleted 2
            
            test-number-sixteen = Will be deleted 3
            
            test-number-seventeen = Имя
            `;

            const result = FluentUtils.mergeWithTodo(oldContent, newContent, target);

            const expected = dedent`
            # Test comment
            test-number-one = { "" }

            # Test comments
            # Test comments
            test-number-two = NEW test text!

            test-number-three =
                NEW test:
                {$test}

            test-number-four = {CAPITALIZE(THE($entity))} test text! NEW

            test-number-five = NEW [color=lightslategray]{CAPITALIZE(SUBJECT($target))} {CONJUGATE-BASIC($target, "shimmer", "shimmers")} with strange transparency.[/color]
            
            # AUTOGEN-Start
            # - [color=yellow]$type[/color] тест текст [color=lightblue]$value[/color].
            # AUTOGEN-End TODO(Update_Locale):
            test-number-six = - [color=yellow]{$type}[/color] NEW test text [color=lightblue]{$value}[/color].

            # AUTOGEN-Start
            # Тест Below is a quick reference guide to several atmospheric devices:
            # Injectors are similar to active vents, but they have no internal pump and do not require power. They cannot be configured, but they can continue to pump gasses up to much higher pressures.
            # AUTOGEN-End TODO(Update_Locale):
            test-number-seven =
                Below is a quick reference guide to several atmospheric devices:
            
                            Passive Vents:
                            These vents don't require power, they allow gases to flow freely both into and out of the pipe network they are attached to.
            
                            Active Vents:
                            These are the most common vents on the station. They have an internal pump, and require power. By default, they will only pump gases out of pipes, and only up to 101 kpa. However, they can be reconfigured using an air alarm. They will also lock out if the room is under 1 kpa, to prevent pumping gasses into space.
            
                            Air Scrubbers:
                            These devices allow gases to be removed from the environment and put into the connected pipe network. They can be configured to select specific gases when connected to an air alarm.
            
                            Air Injectors:
                            Injectors are similar to active vents, but they have no internal pump and do not require power. They cannot be configured, but they can continue to pump gasses up to much higher pressures. NEW
            
            # AUTOGEN-Start
            # Тест Send reinforcements!
            # .desc = Тест An official notice from... an alternate timeline?
            # .content = Тест [head=2]This is an official notice from the [color=red]Chief Security Officer[/color] at a Nanotrasen's Space Station 15.[/head]
            # To whoever receives this letter. I am Sergeant Rigel. My occupation is the CSO. We need immediate assistance.
            # Glory to Nanotrasen.
            # AUTOGEN-End TODO(Update_Locale):
            test-number-eight =   Send reinforcements! NEW
                .desc =         An official notice from... an alternate timeline? NEW
                .content =
                                {"[head=2]This is an official notice from the [color=red]Chief Security Officer[/color] at a Nanotrasen's Space Station 15.[/head]"}
            
                                To whoever receives NEW!!! this letter. I am Sergeant Rigel. My occupation is the CSO. We need immediate assistance.
            
                                Our station is currently under attack by Atomic Agents, this letter is being thrown into a destabilized bluespace anomaly created by our [color=purple]Head of Research[/color].
            
                                I am currently bolted in the Bridge, if you receive this message, please send aid immediately. I don't know how much longer we can last.
            
                                NEW Glory to Nanotrasen.
            
            # AUTOGEN-Start
            # Тест The bolts are { $down ->
            # [true] [color=red]down[/color]
            # AUTOGEN-End TODO(Update_Locale):
            test-number-nine = NEW the bolts are {$down ->
            [true] [color=red]NEW down[/color]
            *[false] [color=green]up[/color]
            }.
            
            # AUTOGEN-Start
            # [0] Wh Тест
            # [4] TWh
            # AUTOGEN-End TODO(Update_Locale):
            test-number-ten = { TOSTRING($divided, "F1") } { $places ->
                [0] Wh
                [1] kWh
                [2] MWh
                [3] GWh
                [4] NEW
                *[5] ???
            }

            test-number-eleven = { $amount ->
                [1] {NATURALFIXED($amount, 2)} {$unit} of {$material} ([color=red]{NATURALFIXED($missingAmount, 2)} {$unit} missing[/color]) NEW
                *[other] {NATURALFIXED($amount, 2)} {MAKEPLURAL($unit)} of {$material} ([color=red]{NATURALFIXED($missingAmount, 2)} {MAKEPLURAL($unit)} missing[/color])
            }
            
            test-number-thirteen = Will be added
            
            test-number-seventeen = Имя
            `;

            expect(result).toEqual(expected);
        });

        it('wraps changed entity keys with AUTOGEN comment block containing old value', () => {
            const oldContent = dedent`
                ent-TestId0 = Will be deleted
                        .desc = Will be deleted
            
                ent-TestId1 = { ent-OldTestParent }
                    .desc = { ent-OldTestParent.desc }
                
                ent-TestId2 = test name
                    .desc = test desc
                    .suffix = test suffix
                
                ent-TestId3 = old test name
                    .desc = old test desc
                    .suffix = old test suffix
                
                ent-TestId4 = { ent-TestParent4 }
                    .desc = old test desc
                    .suffix = test suffix
                
                ent-TestId5 = test name
                    .desc = { ent-TestParent5.desc }
                    .suffix = old test suffix
                
                ent-TestId6 = old test name
                    .desc = test desc

                ent-TestId8 = Will be deleted
                    .desc = Will be deleted
                    
                ent-TestId9 = Will be deleted 2
                    .desc = Will be deleted 2
                    
                ent-TestId10 = Will be deleted 3
                    .desc = Will be deleted 3
                    
                ent-TestId11 = old test name
                    .desc = old test desc
                    .suffix = old test suffix
                    
                ent-TestId12 = name
                    .desc = desc
                    .suffix = suffix
            `;

            const newContent = dedent`
                ent-TestId1 = { ent-NewTestParent }
                    .desc = { ent-NewTestParent.desc }
                
                ent-TestId2 = NEW test name
                    .desc = test desc
                    .suffix = test suffix
                
                ent-TestId3 = NEW test name
                    .desc = NEW test desc
                    .suffix = NEW test suffix
                
                ent-TestId4 = { ent-TestParent4 }
                    .desc = new test desc
                    .suffix = test suffix
                
                ent-TestId5 = test name
                    .desc = { ent-TestParent5.desc }
                    .suffix = new test suffix
                
                ent-TestId6 = new test name
                    .desc = test desc
            
                ent-TestId7 = { "" }
                    .desc = { "" }

                ent-TestId11 = old test name
                    .desc = old test desc
                    .suffix = old test suffix
                    
                ent-TestId12 = name
                    .desc = desc
                    .suffix = suffix
            `;

            const target = dedent`
                ent-TestId1 = { ent-OldTestParent1 }
                    .desc = { ent-OldTestParent1.desc }
                
                ent-TestId2 = тестовое имя
                    .desc = тестовое описание
                    .suffix = тестовый суффикс
                
                ent-TestId3 = old test name
                    .desc = old test desc
                    .suffix = old test suffix
                
                ent-TestId4 = { ent-TestParent4 }
                    .desc = старое тестовое описание
                    .suffix = test suffix
                
                ent-TestId5 = test name
                    .desc = { ent-TestParent5.desc }
                    .suffix = старый тестовый суффикс
                
                ent-TestId6 = старое тестовое имя
                    .desc = test desc

                ent-TestId8 = Will be deleted
                    .desc = Will be deleted
                    
                ent-TestId12 = имя
                    .desc = описание
                    .suffix = суффикс
            `;

            const result = FluentUtils.mergeWithTodo(oldContent, newContent, target);

            const expected = dedent`
            ent-TestId1 = { ent-NewTestParent }
                .desc = { ent-NewTestParent.desc }
            
            # AUTOGEN-Start
            # тестовое имя
            # .desc = тестовое описание
            # .suffix = тестовый суффикс
            # AUTOGEN-End TODO(Update_Locale):
            ent-TestId2 = NEW test name
                .desc = test desc
                .suffix = test suffix
            
            ent-TestId3 = NEW test name
                .desc = NEW test desc
                .suffix = NEW test suffix
            
            # AUTOGEN-Start
            # .desc = старое тестовое описание
            # AUTOGEN-End TODO(Update_Locale):
            ent-TestId4 = { ent-TestParent4 }
                .desc = new test desc
                .suffix = test suffix
            
            # AUTOGEN-Start
            # .suffix = старый тестовый суффикс
            # AUTOGEN-End TODO(Update_Locale):
            ent-TestId5 = test name
                .desc = { ent-TestParent5.desc }
                .suffix = new test suffix
            
            # AUTOGEN-Start
            # старое тестовое имя
            # AUTOGEN-End TODO(Update_Locale):
            ent-TestId6 = new test name
                .desc = test desc
            
            ent-TestId7 = { "" }
                .desc = { "" }

            ent-TestId11 = old test name
                .desc = old test desc
                .suffix = old test suffix
                
            ent-TestId12 = имя
                .desc = описание
                .suffix = суффикс
            `;

            expect(result).toEqual(expected);
        });
    });
});