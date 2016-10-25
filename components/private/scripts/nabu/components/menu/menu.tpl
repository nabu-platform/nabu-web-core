<template id="n-menu">
	<div class="n-menu">
		<ul>
			<li v-for="item in items" :class="{ 'active' : activated(item), 'inactive': !activated(item)}">
				<a v-if="!item.children" href="javascript:void(0)" v-on:click="item.handle()">{{ item.title }}</a>
				<a v-if="item.children" class="dropdown" href="javascript:void(0)" v-on:click="toggle(item)">{{ item.title }}</a>
				<n-menu v-if="item.children" :items="item.children"></n-menu>
			</li>
		</ul>
	</div>
</template>