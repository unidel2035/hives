#!/usr/bin/env python3
"""
Улучшенный PAC файл декомпилятор с поддержкой LZP декомпиляции
Декомпилирует PAC файл и извлекает правила прокси включая сжатые домены
"""

import json
import re
import base64
import zlib
import sys
from typing import Dict, List, Tuple, Any


class LZPDecompressor:
    """Простая реализация LZP декомпрессии"""
    
    def __init__(self):
        self.table = {}
        self.hash_mask = (1 << 18) - 1
        self.table_len = 1 << 18
        self.hash_val = 0
    
    def decompress(self, data: str, mask: str, limit: int = None) -> Tuple[str, int, int]:
        """Базовая LZP декомпрессия"""
        try:
            # Декодируем base64 маску
            mask_data = self.decode_base64_mask(mask)
            data_pos = 0
            mask_pos = 0
            output = []
            
            while mask_pos < len(mask_data) and (limit is None or len(output) < limit):
                if mask_pos >= len(mask_data):
                    break
                    
                mask_byte = mask_data[mask_pos]
                mask_pos += 1
                
                for bit_pos in range(8):
                    if mask_pos > len(mask_data):
                        break
                        
                    if mask_byte & (1 << bit_pos):
                        # Извлекаем из таблицы
                        if self.hash_val in self.table:
                            char = self.table[self.hash_val]
                        else:
                            char = chr(0)
                    else:
                        # Извлекаем из данных
                        if data_pos < len(data):
                            char = data[data_pos]
                            data_pos += 1
                            # Сохраняем в таблицу
                            self.table[self.hash_val] = char
                        else:
                            char = chr(0)
                    
                    if char:
                        output.append(char)
                        # Обновляем хеш
                        self.hash_val = ((self.hash_val << 7) ^ ord(char)) & self.hash_mask
                    
                    if limit and len(output) >= limit:
                        break
                
                if limit and len(output) >= limit:
                    break
            
            return ''.join(output), data_pos, mask_pos
            
        except Exception as e:
            print(f"⚠ Ошибка LZP декомпрессии: {e}")
            return "", 0, 0
    
    def decode_base64_mask(self, mask: str) -> List[int]:
        """Декодирует base64 маску"""
        try:
            # Заменяем паттерны
            cleaned_mask = mask.replace('!A', '!').replace('gA', '@')
            cleaned_mask = cleaned_mask.replace('AB', '#').replace('AQ', '$')
            cleaned_mask = cleaned_mask.replace('AE', '%').replace('AC', '^')
            
            # Декодируем base64
            decoded = base64.b64decode(cleaned_mask)
            return list(decoded)
        except Exception as e:
            print(f"⚠ Ошибка декодирования маски: {e}")
            return []


class AdvancedPACDecompiler:
    def __init__(self, pac_file_path: str):
        self.pac_file_path = pac_file_path
        self.pac_content = ""
        self.domains = {}
        self.d_ipaddr = []
        self.special = []
        self.domains_lzp = ""
        self.mask_lzp = ""
        self.decompressor = LZPDecompressor()
        
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
            # Находим секцию domains
            domains_match = re.search(r'var domains = ({.*?});', self.pac_content, re.DOTALL)
            if domains_match:
                domains_str = domains_match.group(1)
                # Преобразуем в Python dict
                self.domains = eval(domains_str)
                print(f"✓ Извлечено {len(self.domains)} зон с доменами")
            else:
                print("⚠ Секция domains не найдена")
        except Exception as e:
            print(f"✗ Ошибка извлечения доменов: {e}")
    
    def extract_ip_list(self):
        """Извлекает список заблокированных IP адресов"""
        try:
            # Находим список IP адресов
            ip_match = re.search(r'var d_ipaddr = "(.*?)";', self.pac_content, re.DOTALL)
            if ip_match:
                ip_data = ip_match.group(1)
                # Обрабатываем сжатые IP данные
                ip_list = ip_data.replace('\\n', ' ').replace('\\', '').split()
                # Преобразуем в числовые значения
                processed_ips = []
                for ip_str in ip_list:
                    try:
                        # Пытаемся преобразовать в число
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
            special_match = re.search(r'var special = \[(.*?)\];', self.pac_content, re.DOTALL)
            if special_match:
                special_str = special_match.group(1)
                # Извлекаем CIDR записи
                cidr_matches = re.findall(r'\[(.*?)\]', special_str)
                for cidr in cidr_matches:
                    parts = cidr.split(',')
                    if len(parts) == 2:
                        ip = parts[0].strip('"')
                        mask = int(parts[1])
                        self.special.append([ip, mask])
                print(f"✓ Извлечено {len(self.special)} специальных CIDR диапазонов")
            else:
                print("⚠ Специальные CIDR не найдены")
        except Exception as e:
            print(f"✗ Ошибка извлечения специальных CIDR: {e}")
    
    def extract_lzp_data(self):
        """Извлекает сжатые данные LZP"""
        try:
            # Ищем domains_lzp
            domains_lzp_match = re.search(r'var domains_lzp = "(.*?)";', self.pac_content, re.DOTALL)
            if domains_lzp_match:
                self.domains_lzp = domains_lzp_match.group(1)
                print(f"✓ Найдены сжатые данные доменов ({len(self.domains_lzp)} символов)")
            
            # Ищем mask_lzp
            mask_lzp_match = re.search(r'var mask_lzp = "(.*?)";', self.pac_content, re.DOTALL)
            if mask_lzp_match:
                self.mask_lzp = mask_lzp_match.group(1)
                print(f"✓ Найдена маска LZP ({len(self.mask_lzp)} символов)")
                
                # Пытаемся декомпилировать LZP данные
                self.decompress_lzp_data()
            else:
                print("⚠ Маска LZP не найдена")
        except Exception as e:
            print(f"✗ Ошибка извлечения LZP данных: {e}")
    
    def decompress_lzp_data(self):
        """Декомпилирует LZP данные"""
        try:
            if not self.domains_lzp or not self.mask_lzp:
                print("⚠ LZP данные неполные")
                return
            
            print("🔄 Начинаем декомпиляцию LZP данных...")
            
            # Декомпилируем данные частями
            decompressed_data = ""
            remaining_data = self.domains_lzp
            remaining_mask = self.mask_lzp
            
            # Обрабатываем домены
            for zone, domain_dict in self.domains.items():
                for length, count in domain_dict.items():
                    if isinstance(count, int) and count > 0:
                        # Декомпилируем данные для этой группы
                        decompressed, data_used, mask_used = self.decompressor.decompress(
                            remaining_data, remaining_mask, count
                        )
                        
                        if decompressed and len(decompressed) >= count:
                            # Сохраняем декомпилированные домены
                            self.domains[zone][length] = decompressed[:count]
                            # Обрезаем оставшиеся данные
                            remaining_data = remaining_data[data_used:]
                            remaining_mask = remaining_mask[mask_used:]
                            print(f"✓ Декомпилировано {count} доменов для зоны {zone} (длина {length})")
                        else:
                            print(f"⚠ Не удалось декомпилировать {count} доменов для зоны {zone}")
            
            print("✓ LZP декомпиляция завершена")
            
        except Exception as e:
            print(f"✗ Ошибка LZP декомпиляции: {e}")
    
    def extract_proxy_rules(self):
        """Извлекает правила прокси"""
        try:
            # Ищем функцию FindProxyForURL
            proxy_match = re.search(r'return "(.*?)";', self.pac_content)
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
        
        for zone, domain_dict in self.domains.items():
            if isinstance(domain_dict, dict):
                zone_domains = 0
                for length, data in domain_dict.items():
                    if isinstance(data, int):
                        zone_domains += data
                    elif isinstance(data, str):
                        zone_domains += len(data)
                zone_stats[zone] = zone_domains
                total_domains += zone_domains
                print(f"{zone:>10}: {zone_domains:>6} доменов")
        
        print(f"\nВСЕГО ДОМЕНОВ: {total_domains}")
        
        # Топ 10 зон по количеству доменов
        top_zones = sorted(zone_stats.items(), key=lambda x: x[1], reverse=True)[:10]
        print(f"\nТОП-10 ЗОН ПО КОЛИЧЕСТВУ ДОМЕНОВ:")
        for i, (zone, count) in enumerate(top_zones, 1):
            print(f"{i:>2}. {zone:>10}: {count:>6} доменов")
    
    def export_rules(self, output_file: str = None):
        """Экспортирует правила в файл"""
        if output_file is None:
            output_file = "pac_rules_detailed.json"
        
        # Подсчитываем статистику
        total_domains = 0
        for zone_data in self.domains.values():
            if isinstance(zone_data, dict):
                for data in zone_data.values():
                    if isinstance(data, int):
                        total_domains += data
                    elif isinstance(data, str):
                        total_domains += len(data)
        
        rules = {
            "proxy_rules": self.extract_proxy_rules(),
            "domains": self.domains,
            "blocked_ips_sample": self.d_ipaddr[:50],  # Первые 50 IP
            "special_cidrs": self.special,
            "statistics": {
                "total_zones": len(self.domains),
                "total_domains": total_domains,
                "blocked_ip_count": len(self.d_ipaddr),
                "special_cidr_count": len(self.special),
                "lz_compressed": bool(self.domains_lzp)
            }
        }
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(rules, f, indent=2, ensure_ascii=False)
            print(f"✓ Правила экспортированы в: {output_file}")
        except Exception as e:
            print(f"✗ Ошибка экспорта: {e}")
    
    def run_analysis(self):
        """Запускает полный анализ PAC файла"""
        print("=== ДЕКОМПИЛЯЦИЯ PAC ФАЙЛА (УЛУЧШЕННАЯ ВЕРСИЯ) ===\n")
        
        if not self.load_pac_file():
            return False
        
        self.extract_domains()
        self.extract_ip_list()
        self.extract_special_cidrs()
        self.extract_lzp_data()
        
        self.analyze_domains()
        self.export_rules()
        
        print("\n=== ЗАВЕРШЕНО ===")
        return True


def main():
    if len(sys.argv) < 2:
        print("Использование: python pac_decompiler_advanced.py <pac_file>")
        print("Пример: python pac_decompiler_advanced.py pac.pac")
        sys.exit(1)
    
    pac_file = sys.argv[1]
    decompiler = AdvancedPACDecompiler(pac_file)
    decompiler.run_analysis()


if __name__ == "__main__":
    main()
