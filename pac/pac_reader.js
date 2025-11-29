#!/usr/bin/env node
/**
 * JavaScript декомпилятор PAC файла
 * Извлекает и анализирует правила из PAC файла
 */

const fs = require('fs');
const path = require('path');

class PACReader {
    constructor(pacFilePath) {
        this.pacFilePath = pacFilePath;
        this.pacContent = '';
        this.domains = {};
        this.dIpAddr = [];
        this.special = [];
        this.proxyRules = '';
    }

    loadPACFile() {
        try {
            this.pacContent = fs.readFileSync(this.pacFilePath, 'utf-8');
            console.log(`✓ PAC файл загружен: ${this.pacFilePath}`);
            return true;
        } catch (error) {
            console.error(`✗ Ошибка загрузки PAC файла: ${error.message}`);
            return false;
        }
    }

    extractDomains() {
        try {
            // Находим секцию domains
            const domainsMatch = this.pacContent.match(/var domains = ({[\s\S]*?});/);
            if (domainsMatch) {
                const domainsStr = domainsMatch[1];
                // Преобразуем в объект JavaScript
                this.domains = eval(`(${domainsStr})`);
                const totalDomains = Object.values(this.domains).reduce((sum, domainObj) => sum + Object.keys(domainObj).length, 0);
                console.log(`✓ Извлечено ${Object.keys(this.domains).length} зон с ${totalDomains} доменами`);
            } else {
                console.warn('⚠ Секция domains не найдена');
            }
        } catch (error) {
            console.error(`✗ Ошибка извлечения доменов: ${error.message}`);
        }
    }

    extractIPList() {
        try {
            // Находим список IP адресов
            const ipMatch = this.pacContent.match(/var d_ipaddr = "([\s\S]*?)";/);
            if (ipMatch) {
                const ipData = ipMatch[1];
                // Обрабатываем IP данные
                this.dIpAddr = ipData.replace(/\\n/g, '').replace(/\\/g, '').split(/\s+/).filter(ip => ip.length > 0);
                console.log(`✓ Извлечено ${this.dIpAddr.length} IP адресов`);
            } else {
                console.warn('⚠ Список IP адресов не найден');
            }
        } catch (error) {
            console.error(`✗ Ошибка извлечения IP адресов: ${error.message}`);
        }
    }

    extractSpecialCIDRs() {
        try {
            const specialMatch = this.pacContent.match(/var special = \[([\s\S]*?)\];/);
            if (specialMatch) {
                const specialStr = specialMatch[1];
                // Извлекаем CIDR записи
                const cidrMatches = specialStr.match(/\[(.*?)\]/g);
                if (cidrMatches) {
                    this.special = cidrMatches.map(cidr => {
                        const parts = cidr.replace(/[\[\]"]/g, '').split(',');
                        return [parts[0], parseInt(parts[1])];
                    });
                    console.log(`✓ Извлечено ${this.special.length} специальных CIDR диапазонов`);
                }
            } else {
                console.warn('⚠ Специальные CIDR не найдены');
            }
        } catch (error) {
            console.error(`✗ Ошибка извлечения специальных CIDR: ${error.message}`);
        }
    }

    extractProxyRules() {
        try {
            // Ищем функцию FindProxyForURL и извлекаем правила
            const functionMatch = this.pacContent.match(/return "(.*?)";/);
            if (functionMatch) {
                this.proxyRules = functionMatch[1];
                console.log(`✓ Найдено правило прокси: ${this.proxyRules}`);
                return this.proxyRules;
            }
        } catch (error) {
            console.error(`✗ Ошибка извлечения правил прокси: ${error.message}`);
        }
        return null;
    }

    extractLZPData() {
        try {
            // Ищем domains_lzp
            const domainsLzpMatch = this.pacContent.match(/var domains_lzp = "(.*?)";/);
            if (domainsLzpMatch) {
                const domainsLzp = domainsLzpMatch[1];
                console.log(`✓ Найдены сжатые данные доменов (${domainsLzp.length} символов)`);
            }

            // Ищем mask_lzp
            const maskLzpMatch = this.pacContent.match(/var mask_lzp = "(.*?)";/);
            if (maskLzpMatch) {
                const maskLzp = maskLzpMatch[1];
                console.log(`✓ Найдена маска LZP (${maskLzp.length} символов)`);
            }
        } catch (error) {
            console.error(`✗ Ошибка извлечения LZP данных: ${error.message}`);
        }
    }

    analyzeDomains() {
        if (Object.keys(this.domains).length === 0) {
            console.warn('⚠ Домены не извлечены');
            return;
        }

        console.log('\n=== АНАЛИЗ ДОМЕНОВ ===');
        const zoneStats = {};

        for (const [zone, domainDict] of Object.entries(this.domains)) {
            const totalDomains = Object.keys(domainDict).length;
            zoneStats[zone] = totalDomains;
            console.log(`${zone.padEnd(10)}: ${totalDomains.toString().padEnd(4)} доменов`);
        }

        // Топ 10 зон по количеству доменов
        const sortedZones = Object.entries(zoneStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        console.log('\nТОП-10 ЗОН ПО КОЛИЧЕСТВУ ДОМЕНОВ:');
        sortedZones.forEach(([zone, count], index) => {
            console.log(`${(index + 1).toString().padStart(2)}. ${zone.padEnd(10)}: ${count.toString().padEnd(4)} доменов`);
        });
    }

    exportRules(outputFile = null) {
        if (!outputFile) {
            outputFile = 'pac_rules.json';
        }

        const totalDomains = Object.values(this.domains)
            .reduce((sum, domainObj) => sum + Object.keys(domainObj).length, 0);

        const rules = {
            proxy_rules: this.proxyRules,
            domains: this.domains,
            blocked_ips: this.dIpAddr.slice(0, 100), // Первые 100 IP
            special_cidrs: this.special,
            statistics: {
                total_zones: Object.keys(this.domains).length,
                total_domains: totalDomains,
                blocked_ip_count: this.dIpAddr.length,
                special_cidr_count: this.special.length
            }
        };

        try {
            fs.writeFileSync(outputFile, JSON.stringify(rules, null, 2), 'utf-8');
            console.log(`✓ Правила экспортированы в: ${outputFile}`);
        } catch (error) {
            console.error(`✗ Ошибка экспорта: ${error.message}`);
        }
    }

    runAnalysis() {
        console.log('=== ДЕКОМПИЛЯЦИЯ PAC ФАЙЛА ===\n');

        if (!this.loadPACFile()) {
            return false;
        }

        this.extractDomains();
        this.extractIPList();
        this.extractSpecialCIDRs();
        this.extractLZPData();

        this.analyzeDomains();
        this.exportRules();

        console.log('\n=== ЗАВЕРШЕНО ===');
        return true;
    }
}

// Главная функция
function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log('Использование: node pac_reader.js <pac_file>');
        console.log('Пример: node pac_reader.js pac.pac');
        process.exit(1);
    }

    const pacFile = args[0];
    const reader = new PACReader(pacFile);
    reader.runAnalysis();
}

// Запуск если файл вызван напрямую
if (require.main === module) {
    main();
}

module.exports = PACReader;