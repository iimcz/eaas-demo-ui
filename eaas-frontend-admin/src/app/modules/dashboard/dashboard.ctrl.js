module.exports = ["descriptions", function (descriptions) {
    const resourceProviderDescriptions = descriptions.reduce(function(result, response) {
        const providers = response.data.resource_providers;
        providers.forEach(function (provider) {
            provider.clusterName = response.data.name;
        });

        return result.concat(providers);
    }, []);

    const resourceProviders = resourceProviderDescriptions.map(function (rpd) {
        const capacity_cpu = rpd.node_pool.capacity.cpu;
        const free_cpu = rpd.node_pool.resources_free.cpu;
        const pending_cpu = rpd.node_pool.resources_pending.cpu;
        const used_cpu = rpd.node_pool.resources_allocated.cpu;

        const capacity_memory = rpd.node_pool.capacity.memory;
        const free_memory = rpd.node_pool.resources_free.memory;
        const pending_memory = rpd.node_pool.resources_pending.memory;
        const used_memory = rpd.node_pool.resources_allocated.memory;

        const num_nodes = rpd.node_pool.num_nodes;
        const num_unused_nodes = rpd.node_pool.num_nodes_unused;
        const num_used_nodes = (num_nodes < 0) ? 0 : num_nodes - num_unused_nodes;
        const num_unhealthy_nodes = rpd.node_pool.num_nodes_unhealthy;
        const num_healthy_nodes = (num_nodes < 0) ? 0 : num_nodes - num_unhealthy_nodes;

        const nodeDescriptions = (num_nodes < 0) ? [] : rpd.node_pool.nodes;
        const nodes = nodeDescriptions.map(function (nd) {
            const capacity_cpu = nd.capacity.cpu;
            const used_cpu = nd.utilization.cpu;
            const free_cpu = capacity_cpu - used_cpu;

            const capacity_memory = nd.capacity.memory;
            const used_memory = nd.utilization.memory;
            const free_memory = capacity_memory - used_memory;

            const allocations = nd.allocations.map(function (allocation) {
                return {
                    id: allocation.id,
                    allocated_cpu: allocation.spec.cpu,
                    allocated_memory: allocation.spec.memory
                };
            });

            return {
                id: nd.id,
                used: nd.is_used,
                healthy: nd.is_healthy,
                capacity_cpu: capacity_cpu,
                chart_cpu_values: [used_cpu, free_cpu],
                capacity_memory: capacity_memory,
                chart_memory_values: [used_memory, free_memory],
                allocations: allocations
            };
        });

        return {
            name: rpd.name,
            type: rpd.type,
            cluster_name: rpd.clusterName,
            num_requests: rpd.num_requests_total,
            num_requests_deferred: rpd.num_requests_deferred,
            num_requests_expired: rpd.num_requests_expired,
            num_requests_failed: rpd.num_requests_failed,
            num_nodes: num_nodes,
            capacity_cpu: capacity_cpu,
            chart_cpu_values: [used_cpu, free_cpu, pending_cpu],
            capacity_memory: capacity_memory,
            chart_memory_values: [used_memory, free_memory, pending_memory],
            nodes: nodes,
            nodes_usage: [num_used_nodes, num_unused_nodes],
            nodes_health: [num_healthy_nodes, num_unhealthy_nodes]
        };
    });

    const vm = this;

    vm.resourceProviders = resourceProviders;
    vm.chartNodeUsageLabels = ['Used', 'Unused'];
    vm.chartNodeHealthLabels = ['Healthy', 'Unhealthy'];
    vm.chartCPULabels = ['Used', 'Free', 'Pending'];
    vm.chartMemoryLabels = ['Used', 'Free', 'Pending'];
    vm.chartNodeCPULabels = ['Used', 'Free'];
    vm.chartNodeMemoryLabels = ['Used', 'Free'];

    const CUTOUT_PERCENTAGE = 30;

    vm.chartNodesOptions = {
        rotation: Math.PI,
        circumference: Math.PI,
        cutoutPercentage: CUTOUT_PERCENTAGE,
        legend: {
            display: true,
            position: 'bottom'
        }
    };

    vm.chartCPUOptions = {
        rotation: Math.PI,
        circumference: Math.PI,
        cutoutPercentage: CUTOUT_PERCENTAGE,
        legend: {
            display: true,
            position: 'bottom'
        },
        tooltips: {
            callbacks: {
                label: function (tooltipItem, data) {
                    return ' ' + data.labels[tooltipItem.index] + ': ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + ' mcores';
                }
            }
        }
    };

    vm.chartMemoryOptions = {
        rotation: Math.PI,
        circumference: Math.PI,
        cutoutPercentage: CUTOUT_PERCENTAGE,
        legend: {
            display: true,
            position: 'bottom'
        },
        tooltips: {
            callbacks: {
                label: function (tooltipItem, data) {
                    return ' ' + data.labels[tooltipItem.index] + ': ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + 'MB';
                }
            }
        }
    };

    vm.nodeChartCPUOptions = {
        rotation: Math.PI,
        circumference: Math.PI,
        cutoutPercentage: CUTOUT_PERCENTAGE,
        legend: {
            display: true,
            position: 'bottom'
        },
        tooltips: {
            callbacks: {
                label: function (tooltipItem, data) {
                    return ' ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + ' mcores';
                }
            }
        }
    };

    vm.nodeChartMemoryOptions = {
        rotation: Math.PI,
        circumference: Math.PI,
        cutoutPercentage: CUTOUT_PERCENTAGE,
        legend: {
            display: true,
            position: 'bottom'
        },
        tooltips: {
            callbacks: {
                label: function (tooltipItem, data) {
                    return ' ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + 'MB';
                }
            }
        }
    };
}];
