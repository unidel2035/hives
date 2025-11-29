#!/usr/bin/env python3
"""
PAC файл декомпилятор
Декомпилирует PAC файл и извлекает правила прокси
"""

import json
import re
import base64
import zlib
import sys
from typing import Dict, List, Tuple, Any


class PACDecompiler:
    def __init__(self, pac_file_path: str):
        self.pac_file_path = pac_file_path
        self.pac_content = ""
        self.domains = {}
        self.d_ipaddr = []
        self.special = []
        self.domains_lzp = ""
        self.mask_lzp = ""
        
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
                ip_list = ip_data.replace('\\', '').split()
                self.d_ipaddr = ip_list
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
        except Exception as e:
            print(f"✗ Ошибка извлечения LZP данных: {e}")
    
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
    
    def decode_base64_lzp(self, encoded_data: str) -> str:
        """Декодирует base64 LZP данные"""
        try:
            # Заменяем символы и декодируем base64
            cleaned_data = encoded_data.replace('!A', '!').replace('gA', '@')
            decoded = base64.b64decode(cleaned_data)
            return decoded.decode('utf-8', errors='ignore')
        except Exception as e:
            print(f"✗ Ошибка декодирования LZP: {e}")
            return ""
    
    def analyze_domains(self):
        """Анализирует домены по зонам"""
        if not self.domains:
            print("⚠ Домены не извлечены")
            return
        
        print("\n=== АНАЛИЗ ДОМЕНОВ ===")
        zone_stats = {}
        
        for zone, domain_dict in self.domains.items():
            total_domains = len(domain_dict)
            zone_stats[zone] = total_domains
            print(f"{zone:>10}: {total_domains:>4} доменов")
        
        # Топ 10 зон по количеству доменов
        top_zones = sorted(zone_stats.items(), key=lambda x: x[1], reverse=True)[:10]
        print(f"\nТОП-10 ЗОН ПО КОЛИЧЕСТВУ ДОМЕНОВ:")
        for i, (zone, count) in enumerate(top_zones, 1):
            print(f"{i:>2}. {zone:>10}: {count:>4} доменов")
    
    def export_rules(self, output_file: str = None):
        """Экспортирует правила в файл"""
        if output_file is None:
            output_file = "pac_rules.json"
        
        rules = {
            "proxy_rules": self.extract_proxy_rules(),
            "domains": self.domains,
            "blocked_ips": self.d_ipaddr[:100],  # Первые 100 IP
            "special_cidrs": self.special,
            "statistics": {
                "total_zones": len(self.domains),
                "total_domains": sum(len(domains) for domains in self.domains.values()),
                "blocked_ip_count": len(self.d_ipaddr),
                "special_cidr_count": len(self.special)
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
        print("=== ДЕКОМПИЛЯЦИЯ PAC ФАЙЛА ===\n")
        
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
        print("Использование: python pac_decompiler.py <pac_file>")
        print("Пример: python pac_decompiler.py pac.pac")
        sys.exit(1)
    
    pac_file = sys.argv[1]
    decompiler = PACDecompiler(pac_file)
    decompiler.run_analysis()


if __name__ == "__main__":
    main()