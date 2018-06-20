<template>
	<div class="container-fluid">
		<div class="row">
			<div class="col-6 py-3 px-4">
				<span>Дата</span>
				<input type="date">
				<span>–</span>
				<input type="date">
			</div>
		</div>
		<div class="row">
			<div class="col-12">
				<div class="container-fluid py-3 px-2">
					<div class="row">
						<div class="col-4">
							<span>Постановщик</span>
							<input type="text">
						</div>
						<div class="col-4">
							<span>Ответственный</span>
							<input type="text">
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	data () {
    return {

    }
  }
}
</script>