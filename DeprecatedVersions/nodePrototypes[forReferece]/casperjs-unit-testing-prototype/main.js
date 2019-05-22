$(document).ready(function() {
	$("#left").css("display","inline-block");

	$("#left").on("click", function() {
		$(this).addClass("clickOn");
	});
});