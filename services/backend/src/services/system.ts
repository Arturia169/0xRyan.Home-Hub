import si from 'systeminformation';
import { logger } from '../utils/logger.js';

const log = logger.child('SystemService');

export interface SystemStats {
    cpu: {
        load: number;
    };
    memory: {
        usedPercent: number;
    };
    containers: {
        name: string;
        status: string;
    }[];
}

/**
 * 获取系统状态和 Docker 容器信息
 */
export async function getSystemStats(): Promise<SystemStats> {
    try {
        // 1. 获取 CPU 负载
        const loadData = await si.currentLoad();

        // 2. 获取内存信息
        const memData = await si.mem();
        const usedPercent = (memData.active / memData.total) * 100;

        // 3. 获取所有 Docker 容器状态
        let containers: { name: string; status: string }[] = [];
        try {
            const dockerData = await si.dockerContainers(true); // true means all containers
            containers = dockerData.map(c => ({
                name: c.name,
                status: c.state // e.g., 'running', 'exited'
            }));
        } catch (dockerErr) {
            log.warn('无法获取 Docker 容器信息 (请检查 /var/run/docker.sock 是否挂载):', dockerErr);
            // 降级：如果无法获取 docker 信息，返回空列表
        }

        return {
            cpu: {
                load: Math.round(loadData.currentLoad)
            },
            memory: {
                usedPercent: Math.round(usedPercent)
            },
            containers: containers
        };
    } catch (error) {
        log.error('获取系统状态失败:', error);
        return {
            cpu: { load: 0 },
            memory: { usedPercent: 0 },
            containers: []
        };
    }
}
