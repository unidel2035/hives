#!/usr/bin/env python3
"""
Улучшенная LZP декомпиляция PAC файла
Полная реализация с правильным LZP алгоритмом
"""

import base64
import re
import json
import sys
from typing import List, Tuple, Dict, Any


class ImprovedLZPDecompressor:
    """Улучшенная реализация LZP декомпиляции"""
    
    def __init__(self):
        self.table = [0] * 262144  # 2^18
        self.hash_mask = 262143    # (1 << 18) - 1
        self.hash_val = 0
        self.context = 0
        
    def patternreplace(self, s: str, lzpmask: bool) -> str:
        """Улучшенная функция patternreplace"""
        if lzpmask:
            # Паттерны для LZP маски - полный набор
            patterns = {
                'AA': '!', 'gA': '@', 'AB': '#', 'AQ': '\n', 'AE': '%', 'AC': '^', 'AI': '*', 'Ag': '(',
                'AD': ')', 'Aw': '[', 'AM': ']', 'Bg': '-', 'CA': ',', 'IA': '.', 'BA': '?', 'AE': '%', 
                'AC': '^', 'AI': '*', 'Ag': '(', 'AD': ')', 'Aw': '[', 'AM': ']', 'Bg': '-', 'CA': ',', 
                'IA': '.', 'BA': '?'
            }
        else:
            # Паттерны для обычной замены - расширенный набор
            patterns = {
                '!A': 'porn', '!B': 'film', '!C': 'lord', '!D': 'kino', '!E': 'oker', '!F': 'trad',
                '!G': 'line', '!H': 'game', '!I': 'pdom', '!J': 'tion', '!K': '.com', '!L': 'leon',
                '!M': 'port', '!N': 'shop', '!O': 'club', '!P': 'prav', '!Q': 'vest', '!R': 'inco',
                '!S': 'mark', '!T': 'ital', '!U': 'slot', '!V': 'play', '!W': 'eria', '!X': 'russ',
                '!Y': 'vide', '!Z': 'tube', '!@': 'medi', '!#': 'ster', '!%': 'nter', '!^': 'scho',
                '!&': 'free', '!*': 'enta', '!(': 'best', '!)': 'mega', '!=': 'gama', '!+': 'prof',
                '!/': 'oney', '!,': 'rypt', '!<': 'kra3', '!>': 'stor', '!~': 'ture', '![': 'tech',
                '!]': 'ance', '!{': 'coin', '!}': 'seed', '!`': 'anim', '!:': 'stro', '!;': 'ment',
                '!?': 'site', 'A': 'in', 'B': 'an', 'C': 'er', 'D': 'ar', 'E': 'or', 'F': 'et',
                'G': 'al', 'H': 'st', 'I': 'on', 'J': 'en', 'K': 'at', 'L': 'ro', 'M': 'es',
                'N': 'as', 'O': 'el', 'P': 'it', 'Q': 'ch', 'R': 'am', 'S': 'ol', 'T': 'om',
                'U': 'ra', 'V': 'ex', 'W': 'is', 'X': 'ic', 'Y': 're', 'Z': 'os', '@': 'ka',
                '#': 'ot', '$': 'us', '%': 'ap', '^': 'ov', '&': 'im', '*': '-s', '(': 'ad',
                ')': 'il', '=': 'op', '+': 'ed', '/': 'em', ',': 'a-', '<': 'od', '>': 'ir',
                '~': 'id', '[': 'ob', ']': 'ag', '{': 'ig', '}': 'ip', '`': 'ok', ':': 'e-',
                ';': 'ec', '?': 'un'
            }
        
        # Заменяем паттерны
        result = s
        for pattern, replacement in patterns.items():
            result = result.replace(replacement, pattern)
        
        return result
    
    def a2b_function(self, a: str) -> str:
        """Улучшенная функция a2b (base64 декодирование)"""
        try:
            # Применяем patternreplace с lzpmask=true
            processed = self.patternreplace(a, True)
            
            # Добавляем padding если нужно
            missing_padding = len(processed) % 4
            if missing_padding:
                processed += '=' * (4 - missing_padding)
            
            # Декодируем base64
            decoded_bytes = base64.b64decode(processed)
            return decoded_bytes.decode('utf-8', errors='ignore')
        except Exception as e:
            print(f"⚠ Ошибка в a2b декодировании: {e}")
            return ""
    
    def unlzp_function_improved(self, d: str, m: str, lim: int) -> Tuple[str, int, int]:
        """Улучшенная функция unlzp"""
        mask_pos = 0
        d_pos = 0
        out_final = []
        
        # Сброс состояния
        self.table = [0] * 262144
        self.hash_val = 0
        self.context = 0
        
        try:
            while mask_pos < len(m) and len(out_final) < lim:
                # Получаем байт маски
                if mask_pos >= len(m):
                    break
                    
                mask_char = m[mask_pos]
                if not mask_char:
                    break
                
                mask_pos += 1
                mask_byte = ord(mask_char)
                
                # Обрабатываем 8 бит маски
                for i in range(8):
                    if len(out_final) >= lim:
                        break
                        
                    # Проверяем бит маски
                    if mask_byte & (1 << i):
                        # Бит = 1: извлекаем из таблицы
                        if self.hash_val < len(self.table):
                            c = self.table[self.hash_val]
                        else:
                            c = 0
                    else:
                        # Бит = 0: извлекаем из данных
                        if d_pos >= len(d):
                            c = 0
                        else:
                            c = ord(d[d_pos])
                            d_pos += 1
                            # Сохраняем в таблицу
                            if self.hash_val < len(self.table):
                                self.table[self.hash_val] = c
                    
                    out_final.append(chr(c))
                    
                    # Обновляем хеш и контекст
                    self.hash_val = ((self.hash_val << 7) ^ c) & self.hash_mask
                    self.context = ((self.context << 7) ^ c) & 0xFFFF
                
                # Проверяем лимит
                if len(out_final) >= lim:
                    break
            
            return ''.join(out_final), d_pos, mask_pos
            
        except Exception as e:
            print(f"⚠ Ошибка в unlzp_function: {e}")
            return '', d_pos, mask_pos


class FinalPACDecompiler:
    """Финальный декомпилятор с улучшенным LZP"""
    
    def __init__(self, pac_file_path: str):
        self.pac_file_path = pac_file_path
        self.pac_content = ""
        self.domains = {}
        self.d_ipaddr = []
        self.special = []
        self.domains_lzp = ""
        self.mask_lzp = ""
        self.decompressor = ImprovedLZPDecompressor()
        
    def load_pac_file(self):
        """Загружает содержимое PAC файла"""
        try:
            with open(self.pac_file_path, 'r', encoding='utf-8') as f:
                self.pac_content = f.read()
            print(f"✓ PAC файл загружен: {self.pac_file_path}")
            return True
        except Exception as e:
            print(f"✗ Ошибка загрузки PAC файла: {e}")
            return False
    
    def extract_domains(self):
        """Извлекает данные о доменах"""
        try:
            domains_match = re.search(r'domains = (\{.*?\});', self.pac_content, re.DOTALL)
            if domains_match:
                domains_str = domains_match.group(1)
                self.domains = eval(domains_str)
                print(f"✓ Извлечено {len(self.domains)} зон с доменами")
            else:
                print("⚠ Секция domains не найдена")
        except Exception as e:
            print(f"✗ Ошибка извлечения доменов: {e}")
    
    def extract_ip_list(self):
        """Извлекает список заблокированных IP адресов"""
        try:
            ip_match = re.search(r'var d_ipaddr = "([^"]+)"\.split\(" "\);', self.pac_content, re.DOTALL)
            if ip_match:
                ip_str = ip_match.group(1)
                ip_values = [x.strip() for x in ip_str.split() if x.strip()]
                
                processed_ips = []
                for ip_str in ip_values:
                    try:
                        processed_ips.append(int(ip_str, 36))
                    except ValueError:
                        processed_ips.append(ip_str)
                
                self.d_ipaddr = processed_ips
                print(f"✓ Извлечено {len(self.d_ipaddr)} IP адресов")
            else:
                print("⚠ Список IP адресов не найден")
        except Exception as e:
            print(f"✗ Ошибка извлечения IP адресов: {e}")
    
    def extract_special_cidrs(self):
        """Извлекает специальные CIDR диапазоны"""
        try:
            special_match = re.search(r'var special = \[([^\]]+)\];', self.pac_content, re.DOTALL)
            if special_match:
                special_str = special_match.group(1)
                cidr_matches = re.findall(r'\["([^"]+)",\s*(\d+)\]', special_str)
                for ip, mask in cidr_matches:
                    self.special.append([ip, int(mask)])
                print(f"✓ Извлечено {len(self.special)} специальных CIDR диапазонов")
            else:
                print("⚠ Специальные CIDR не найдены")
        except Exception as e:
            print(f"✗ Ошибка извлечения специальных CIDR: {e}")
    
    def extract_lzp_data(self):
        """Извлекает сжатые данные LZP"""
        try:
            domains_lzp_match = re.search(r'var domains_lzp = "([^"]+)";', self.pac_content, re.DOTALL)
            if domains_lzp_match:
                self.domains_lzp = domains_lzp_match.group(1)
                print(f"✓ Найдены сжатые данные доменов ({len(self.domains_lzp)} символов)")
            
            mask_lzp_match = re.search(r'var mask_lzp = "([^"]+)";', self.pac_content, re.DOTALL)
            if mask_lzp_match:
                self.mask_lzp_encoded = mask_lzp_match.group(1)
                print(f"✓ Найдена закодированная маска LZP ({len(self.mask_lzp_encoded)} символов)")
                
                self.mask_lzp = self.decompressor.a2b_function(self.mask_lzp_encoded)
                print(f"✓ Декодирована маска LZP ({len(self.mask_lzp)} символов)")
            else:
                print("⚠ Маска LZP не найдена")
        except Exception as e:
            print(f"✗ Ошибка извлечения LZP данных: {e}")
    
    def decompress_all_domains_improved(self):
        """Улучшенная декомпиляция всех доменов"""
        try:
            if not self.domains_lzp or not self.mask_lzp:
                print("⚠ LZP данные неполные")
                return
            
            print("🔄 Начинаем улучшенную LZP декомпиляцию доменов...")
            
            domains_copy = self.domains.copy()
            remaining_data = self.domains_lzp
            remaining_mask = self.mask_lzp
            
            total_decompressed = 0
            successful_zones = 0
            
            # Обрабатываем каждую зону
            for zone, domain_dict in domains_copy.items():
                print(f"🔄 Обрабатываем зону: {zone}")
                
                zone_decompressed = 0
                zone_success = False
                
                for length, count in domain_dict.items():
                    if isinstance(count, int) and count > 0:
                        print(f"  📝 Длина {length}: {count} доменов")
                        
                        # Увеличиваем буфер для лучшей декомпиляции
                        reqd = min(count * 25, 16384)
                        
                        try:
                            decompressed, data_used, mask_used = self.decompressor.unlzp_function_improved(
                                remaining_data, remaining_mask, reqd
                            )
                            
                            if decompressed and len(decompressed) >= count:
                                # Успешная декомпиляция
                                domains_copy[zone][length] = decompressed[:count]
                                remaining_data = remaining_data[data_used:]
                                remaining_mask = remaining_mask[mask_used:]
                                zone_decompressed += count
                                total_decompressed += count
                                zone_success = True
                                print(f"    ✓ Декомпилировано {count} доменов")
                            else:
                                # Неудачная декомпиляция - помечаем как ошибку
                                domains_copy[zone][length] = f"[LZP_ERROR: need {count}]"
                                print(f"    ⚠ Не удалось декомпилировать {count} доменов")
                                
                        except Exception as e:
                            print(f"    ✗ Ошибка декомпиляции: {e}")
                            domains_copy[zone][length] = f"[LZP_ERROR: {str(e)}]"
                
                if zone_success:
                    successful_zones += 1
                    print(f"  ✅ Зона {zone}: {zone_decompressed} доменов успешно декомпилировано")
                else:
                    print(f"  ❌ Зона {zone}: декомпиляция не удалась")
            
            # Обновляем domains
            self.domains = domains_copy
            print(f"✅ Улучшенная LZP декомпиляция завершена!")
            print(f"📊 Всего декомпилировано: {total_decompressed} доменов")
            print(f"📊 Успешных зон: {successful_zones}/{len(self.domains)}")
            
        except Exception as e:
            print(f"✗ Ошибка улучшенной LZP декомпиляции: {e}")
    
    def extract_proxy_rules(self):
        """Извлекает правила прокси"""
        try:
            proxy_match = re.search(r'return "([^"]+)";', self.pac_content)
            if proxy_match:
                proxy_rule = proxy_match.group(1)
                print(f"✓ Найдено правило прокси: {proxy_rule}")
                return proxy_rule
        except Exception as e:
            print(f"✗ Ошибка извлечения правил прокси: {e}")
        return None
    
    def analyze_domains(self):
        """Анализирует домены по зонам"""
        if not self.domains:
            print("⚠ Домены не извлечены")
            return
        
        print("\n=== АНАЛИЗ ДОМЕНОВ ===")
        zone_stats = {}
        total_domains = 0
        successful_domains = 0
        
        for zone, domain_dict in self.domains.items():
            if isinstance(domain_dict, dict):
                zone_domains = 0
                zone_successful = 0
                
                for length, data in domain_dict.items():
                    if isinstance(data, int):
                        zone_domains += data
                    elif isinstance(data, str):
                        if not data.startswith('[LZP_ERROR'):
                            zone_domains += len(data.split())
                            zone_successful += len(data.split())
                        else:
                            print(f"⚠ Ошибка в зоне {zone}, длина {length}: {data}")
                
                zone_stats[zone] = zone_domains
                total_domains += zone_domains
                successful_domains += zone_successful
                print(f"{zone:>10}: {zone_domains:>6} доменов (успешно: {zone_successful})")
        
        print(f"\nВСЕГО ДОМЕНОВ: {total_domains}")
        print(f"УСПЕШНО ДЕКОМПИЛИРОВАННЫХ: {successful_domains}")
        print(f"ЭФФЕКТИВНОСТЬ: {successful_domains/total_domains*100:.1f}%" if total_domains > 0 else "0%")
        
        # Топ 10 зон по количеству доменов
        top_zones = sorted(zone_stats.items(), key=lambda x: x[1], reverse=True)[:10]
        print(f"\nТОП-10 ЗОН ПО КОЛИЧЕСТВУ ДОМЕНОВ:")
        for i, (zone, count) in enumerate(top_zones, 1):
            print(f"{i:>2}. {zone:>10}: {count:>6} доменов")
    
    def export_all_data(self, output_file: str = None):
        """Экспортирует все данные"""
        if output_file is None:
            output_file = "pac_final_decompiled.json"
        
        # Подсчитываем статистику
        total_domains = 0
        successful_domains = 0
        for zone_data in self.domains.values():
            if isinstance(zone_data, dict):
                for data in zone_data.values():
                    if isinstance(data, int):
                        total_domains += data
                    elif isinstance(data, str) and not data.startswith('[LZP_ERROR'):
                        total_domains += len(data.split())
                        successful_domains += len(data.split())
        
        # Сохраняем IP адреса
        with open('extracted_ip_addresses_final.txt', 'w') as f:
            for ip in self.d_ipaddr:
                f.write(str(ip) + '\n')
        
        # Сохраняем CIDR диапазоны
        with open('extracted_cidr_ranges_final.txt', 'w') as f:
            for cidr in self.special:
                f.write(f'{cidr[0]}/{cidr[1]}\n')
        
        # Сохраняем домены по зонам
        with open('extracted_domains_final.txt', 'w') as f:
            for zone, domain_dict in self.domains.items():
                f.write(f"\n=== ЗОНА: {zone} ===\n")
                for length, data in domain_dict.items():
                    if isinstance(data, str) and not data.startswith('[LZP_ERROR'):
                        f.write(f"Длина {length}: {data}\n")
        
        rules = {
            "proxy_rules": self.extract_proxy_rules(),
            "domains": self.domains,
            "blocked_ips": self.d_ipaddr,
            "special_cidrs": self.special,
            "statistics": {
                "total_zones": len(self.domains),
                "total_domains": total_domains,
                "successful_domains": successful_domains,
                "blocked_ip_count": len(self.d_ipaddr),
                "special_cidr_count": len(self.special),
                "lz_compressed": bool(self.domains_lzp),
                "decompression_success": successful_domains > 0,
                "efficiency": f"{successful_domains/total_domains*100:.1f}%" if total_domains > 0 else "0%"
            }
        }
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(rules, f, indent=2, ensure_ascii=False)
            print(f"✓ Финальные данные экспортированы в: {output_file}")
            print(f"✓ IP адреса сохранены в: extracted_ip_addresses_final.txt")
            print(f"✓ CIDR диапазоны сохранены в: extracted_cidr_ranges_final.txt")
            print(f"✓ Домены сохранены в: extracted_domains_final.txt")
        except Exception as e:
            print(f"✗ Ошибка экспорта: {e}")
    
    def run_complete_analysis(self):
        """Запускает полный анализ с улучшенным LZP"""
        print("=== ФИНАЛЬНАЯ ДЕКОМПИЛЯЦИЯ PAC ФАЙЛА С УЛУЧШЕННЫМ LZP ===\n")
        
        if not self.load_pac_file():
            return False
        
        self.extract_domains()
        self.extract_ip_list()
        self.extract_special_cidrs()
        self.extract_lzp_data()
        self.decompress_all_domains_improved()
        
        self.analyze_domains()
        self.export_all_data()
        
        print("\n=== ЗАВЕРШЕНО ===")
        return True


def main():
    if len(sys.argv) < 2:
        print("Использование: python lzp_decompiler_final.py <pac_file>")
        print("Пример: python lzp_decompiler_final.py pac.pac")
        sys.exit(1)
    
    pac_file = sys.argv[1]
    decompiler = FinalPACDecompiler(pac_file)
    decompiler.run_complete_analysis()


if __name__ == "__main__":
    main()
